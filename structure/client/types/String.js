const Type = require('../interfaces/Type.js');

class StringType extends Type {

    constructor(client) {

        super(client, {
            name: 'string',
            prompt: {
                start: "Please input a valid string.",
                retry: "That's not a valid string, try again."
            }
        });

    }

    exec(input) {
        return super.succeed(input);
    }


}

module.exports = StringType;
