const Base = require('./Base.js');

class Type extends Base {

    constructor(client, opts = {}) {
        if(!opts) return null;

        super(client, {
            id: opts.name,
            type: 'type'
        });

        this.name = opts.name;
        this.prompt = opts.prompt;

    }

    succeed(result) {
        return {
            error: false,
            result
        };
    }

    fail(reason = null) {
        return {
            error: true,
            reason
        };
    }

}

module.exports = Type;