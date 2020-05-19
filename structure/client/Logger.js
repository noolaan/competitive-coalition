const chalk = require('chalk');

class Logger {

    constructor(client) {

        Object.defineProperty(this, 'client', { value: client });

        this.handleEvents();

    }

    handleEvents() {

        const handler = {
            'ready': () => {
                this.send(`Shard connected with ${this.client.guilds.size} guild${this.client.guilds.size === 1 ? '' : 's'}.`, {
                    code: 'CONNECT',
                    embed: true
                });
            },
            'error': (error) => {
                this.send(error.stack || error, {
                    code: 'ERROR'
                });
            },
            'baseRegister': (base) => {
                this.send(`Base ${chalk.bold(base.resolveable)} has been registered.`, {
                    code: 'LOG',
                    header: `BASE-REGISTER`
                });
            },
            'log': (msg) => {
                this.send(msg, { code: 'LOG' });
            }
        };

        for(const handle of Object.keys(handler)) {
            this.client.on(handle, handler[handle]);
        }

    }

    send(message, { header = '', code = 'LOG', embed = false }) {
        if(!header) header = code;
        process.send({ message: `${header ? `[${chalk.bold(header)}] ` : ''}${message}`, code, embed });
    }


}

module.exports = Logger;