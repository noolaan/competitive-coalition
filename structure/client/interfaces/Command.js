const Base = require('./Base.js');

class Command extends Base {

    constructor(client, opts = {}) {
        if(!opts) return null;

        super(client, {
            id: opts.name,
            type: 'command',
            guarded: opts.guarded,
            disabled: opts.disabled
        });

        Object.defineProperty(this, 'client', { value: client });

        //Basic
        this.name = opts.name;
        this.module = opts.module;
        this.aliases = opts.aliases || [];
        
        //Information
        this.description = opts.description || "A basic command.";
        this.usage = opts.usage || null;

        //Functional
        this.restricted = Boolean(opts.restricted);

        //Flags & Arguments
        this.split = opts.split || 'NONE';
        this.flags = opts.flags || [];

    }

    get moduleResolveable() {
        return `${this.module.id}:${this.id}`;
    }

}

module.exports = Command;