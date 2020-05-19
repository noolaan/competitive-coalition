class Flag {

    constructor(client, commandMessage, opts = {}) {
        if(!opts) return null;

        Object.defineProperty(this, 'client', { value: client });

        //Basic
        this.id = opts.id;
        this.commandMessage = commandMessage;

        //Information
        this.description = opts.description || "A basic flag.";

        //Arguments
        this.arguments = Boolean(opts.arguments);
        this.required = Boolean(opts.required);
        this.type = opts.type || 'string';
        this.prompt = opts.prompt || null;
        this.default = opts.default || null;

        //Miscellaneous
        this.query = null;

    }

    async parse() {

        const type = this.types.get(`type:${this.type}`);
        if(!type) return this._error('COMMAND_ERROR', this.commandMessage);
        
        if(this.default && !this.query) this.query = this.default;
        if(this.required && !this.query) return this._error('FLAG_ERROR', { flag: this, message: (this.prompt ? this.prompt.start : type.prompt.start) });

        const response = type.exec(this.query);
        if(response instanceof Promise) await response;

        if(response.error) return this._error('FLAG_ERROR', { flag: this, message: response.reason || (this.prompt ? this.prompt.retry : type.prompt.retry) });

        this.query = response.result;
        return { error: false };

    }

    get types() {
        return this.client.registry.bases.filter(b=>b.type === 'type');
    }

    _error(code, data = null) {
        return {
            error: true,
            message: this.commandMessage,
            data: data,
            code
        };
    }

}

module.exports = Flag;