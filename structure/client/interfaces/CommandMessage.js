const emojis = require('../../../util/emojis.json');

class CommandMessage {

    constructor(client, opts = {}) {
        if(!opts) return null;

        Object.defineProperty(this, 'client', { value: client });

        this.command = opts.command;
        this.message = opts.message;
        
        this.parameters = null;
        this.flags = null;

        this.UUID = new Date().getTime().toString(36);

    }

    async respond(str, opts = {}) {
        
        if(typeof str === 'string') {
            if(opts.emoji) {
                const emoji = emojis[opts.emoji] || emojis['failure'];
                str = `${emoji} ${str}`;
            }
            if(opts.reply) str = `<@!${this.message.author.id}> ${str}`;
        }

        this.pending = new this.constructor(this.client, {
            message: await this.message.channel.send(str)
        });

        return this.pending;
    }

    async edit(str, opts) {
        if(!this.message.editable) return undefined;
        if(typeof str === 'string') {
            if(opts.emoji) {
                const emoji = emojis[opts.emoji] || emojis['failure'];
                str = `${emoji} ${str}`;
            }
            if(opts.reply) str = `<@!${this.message.author.id}> ${str}`;
        }

        return this.message.edit(str);
    }

    async _resolve(info) {

        try {
            const command = this.command.execute(this, info);
            if(command instanceof Promise) await command;
            return { error: false, data: this, message: this, code: 'SUCCESS' };
        } catch(error) {
            this.client.emit('error', `Command Error | ${this.command.resolveable} | UUID: ${this.UUID}\n${error.stack ? error.stack : error}`);
            return { error: true, code: 'COMMAND_ERROR', data: this, message: this };
        }

    }

    /* Lazy Developer™ */

    get member() {
        return this.message.member;
    }

    get author() {
        return this.message.author;
    }

    get guild() {
        return this.message.guild;
    }

    get channel() {
        return this.message.channel;
    }

    get raw() {
        return this.message;
    }

}

module.exports = CommandMessage;