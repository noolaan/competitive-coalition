const Type = require('../interfaces/Type.js');

class FloatType extends Type {

    constructor(client) {

        super(client, {
            name: 'float',
            prompt: {
                start: "Please input a valid number.",
                retry: "That's not a valid number, try again."
            }
        });

    }

    exec(input) {
        const float = parseInt(input);
        if(Number.isNaN(float)) return super.fail();
        return super.succeed(float);
    }


}

module.exports = FloatType;
