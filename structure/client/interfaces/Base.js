class Base {

    constructor(client, opts = {}) {
        if(!opts) return null;

        Object.defineProperty(this, 'client', { value: client });

        this.id = opts.id;
        this.type = opts.type;

        this.directory = null;

        this.guarded = Boolean(opts.guarded);
        this.disabled = Boolean(opts.disabled);

        this.client.emit('baseRegister', this);


    }

    enable() {

    }

    disable() {

    }

    unload() {

    }

    reload() {

    }

    get resolveable() {
        return `${this.type}:${this.id}`;
    }

}

module.exports = Base;