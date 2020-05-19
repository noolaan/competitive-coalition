/* Adopted by Discord.js */
const EventEmitter = require('events');
const snekfetch = require('snekfetch');
const path = require('path');
const fs = require('fs');

const Shard = require('./Shard');
const Collection = require('../../util/Collection');

class ShardManager extends EventEmitter {

    constructor(file, options = {}) {

        super();

        this.totalShards = options.totalShards || 'auto';
        this.respawn = options.respawn || true;
        this.token = options.token || null;

        this.file = file;
        if (!file) throw new Error('File must be specified.');
        if (!path.isAbsolute(file)) this.file = path.resolve(process.cwd(), file);
        const stats = fs.statSync(this.file);
        if (!stats.isFile()) throw new Error('File path does not point to a file.');

        if(this.totalShards !== 'auto') {
            if (typeof this.totalShards !== 'number' || isNaN(this.totalShards)) throw new TypeError('Amount of shards must be a number.');
            if (this.totalShards < 1) throw new RangeError('Amount of shards must be at least 1.');
            if (this.totalShards !== Math.floor(this.totalShards)) throw new RangeError('Amount of shards must be an integer.');
        }

        this.shards = new Collection();

    }

    createShard(id = this.shards.size) {
        const shard = new Shard(this, id);
        this.shards.set(id, shard);

        this.emit('launch', shard);
        return Promise.resolve(shard);
    }

    spawn(amount = this.totalShards, delay = 5000) {
        if (amount === 'auto') {
            return this.constructor.fetchRecommendedShards(this.token).then(count => {
                this.totalShards = count;
                return this._spawn(count, delay);
            });
        } else {
            if (typeof amount !== 'number' || isNaN(amount)) throw new TypeError('Amount of shards must be a number.');
            if (amount < 1) throw new RangeError('Amount of shards must be at least 1.');
            if (amount !== Math.floor(amount)) throw new TypeError('Amount of shards must be an integer.');
            return this._spawn(amount, delay);
        }
    }

    _spawn(amount, delay) {
        return new Promise(resolve => {
            if (this.shards.size >= amount) throw new Error(`Already spawned ${this.shards.size} shards.`);
            this.totalShards = amount;

            this.createShard();
            if (this.shards.size >= this.totalShards) {
                resolve(this.shards);
                return;
            }

            if (delay <= 0) {
                while (this.shards.size < this.totalShards) this.createShard();
                resolve(this.shards);
            } else {
                const interval = setInterval(() => {
                    this.createShard();
                    if (this.shards.size >= this.totalShards) {
                        clearInterval(interval);
                        resolve(this.shards);
                    }
                }, delay);
            }
        });
    }

    broadcast(message) {
        const promises = [];
        for (const shard of this.shards.values()) promises.push(shard.send(message));
        return Promise.all(promises);
    }

    broadcastEval(script) {
        const promises = [];
        for (const shard of this.shards.values()) promises.push(shard.eval(script));
        return Promise.all(promises);
    }

    fetchClientValues(prop) {
        if (this.shards.size === 0) return Promise.reject(new Error('No shards have been spawned.'));
        if (this.shards.size !== this.totalShards) return Promise.reject(new Error('Still spawning shards.'));
        const promises = [];
        for (const shard of this.shards.values()) promises.push(shard.fetchClientValue(prop));
        return Promise.all(promises);
    }

    static fetchRecommendedShards(token, guildsPerShard = 1000) {
        return new Promise((resolve, reject) => {
            if (!token) throw new Error('A token must be provided.');
            snekfetch.get(`https://discordapp.com/api/v7/gateway/bot`)
                .set('Authorization', `Bot ${token.replace(/^Bot\s*/i, '')}`)
                .end((err, res) => {
                    if (err) reject(err);
                    resolve(res.body.shards * (1000 / guildsPerShard));
                });
        });
    }

}

module.exports = ShardManager;