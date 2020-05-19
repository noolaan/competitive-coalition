/* Adopted by Discord.js */
const childProcess = require('child_process');
const path = require('path');

class Shard {

    constructor(manager, id) {

        this.manager = manager;
        this.id = id;

        this.env = Object.assign({}, process.env, {
            SHARD_ID: this.id,
            SHARD_COUNT: this.manager.totalShards,
            CLIENT_TOKEN: this.manager.token
        });

        this.process = childProcess.fork(path.resolve(this.manager.file), [], {
            env: this.env
        });

        this.process.on('message', this._handleMessage.bind(this));
        this.process.once('exit', () => {
            if(this.manager.respawn) this.manager.createShard(this.id);
        });

        this._evals = new Map();
        this._fetches = new Map();

    }

    send(message) {
        return new Promise((resolve, reject) => {
            const sent = this.process.send(message, err => {
                if (err) reject(err); else resolve(this);
            });
            if (!sent) throw new Error('Failed to send message to shard\'s process.');
        });
    }

    fetchClientValue(prop) {
        if (this._fetches.has(prop)) return this._fetches.get(prop);

        const promise = new Promise((resolve, reject) => {
            const listener = message => {
                if (!message || message._fetchProp !== prop) return;
                this.process.removeListener('message', listener);
                this._fetches.delete(prop);
                resolve(message._result);
            };
            this.process.on('message', listener);

            this.send({ _fetchProp: prop }).catch(err => {
                this.process.removeListener('message', listener);
                this._fetches.delete(prop);
                reject(err);
            });
        });

        this._fetches.set(prop, promise);
        return promise;
    }

    eval(script) {
        if (this._evals.has(script)) return this._evals.get(script);

        const promise = new Promise((resolve, reject) => {
            const listener = message => {
                if (!message || message._eval !== script) return;
                this.process.removeListener('message', listener);
                this._evals.delete(script);
                if (!message._error) resolve(message._result); else reject(this.constructor.makeError(message._error));
            };
            this.process.on('message', listener);

            this.send({ _eval: script }).catch(err => {
                this.process.removeListener('message', listener);
                this._evals.delete(script);
                reject(err);
            });
        });

        this._evals.set(script, promise);
        return promise;
    }

    _handleMessage(message) {
        if (message) {
        // Shard is requesting a property fetch
            if (message._sFetchProp) {
                this.manager.fetchClientValues(message._sFetchProp).then(
                    results => this.send({ _sFetchProp: message._sFetchProp, _result: results }),
                    err => this.send({ _sFetchProp: message._sFetchProp, _error: this.constructor.makePlainError(err) })
                );
                return;
            }

            // Shard is requesting an eval broadcast
            if (message._sEval) {
                this.manager.broadcastEval(message._sEval).then(
                    results => this.send({ _sEval: message._sEval, _result: results }),
                    err => this.send({ _sEval: message._sEval, _error: this.constructor.makePlainError(err) })
                );
                    return;
            }
        }

        this.manager.emit('message', this, message);

    }

    get displayId() {
        const id = this.id.toString().length === 1 ? `0${this.id}` : this.id;
        return `[SHARD-${id}]`;
    }

    static makePlainError({ name, message, stack}) {
        return {
            name,
            message,
            stack
        };
    }

    static makeError({ name, message, stack }) {
        const err = new Error(message);
        err.name = name;
        err.stack = stack;
        return err;
    }

}

module.exports = Shard;