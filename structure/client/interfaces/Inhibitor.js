const Base = require('./Base.js');

class Inhibitor extends Base {

    constructor(client, opts = {}) {
        if(!opts) return null;

        super(client, {
            id: opts.name,
            type: 'inhibitor',
            guarded: opts.guarded
        });

        this.name = opts.name;
        this.priority = opts.priority || 0;

    }

    succeed(inhibitor) {
        return {
            error: false,
            inhibitor
        };
    }

    fail(inhibitor, message) {
        return {
            error: true,
            message,
            inhibitor
        };
    }

}

module.exports = Inhibitor;