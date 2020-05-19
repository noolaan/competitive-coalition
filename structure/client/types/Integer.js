const Type = require('../interfaces/Type.js');

class IntegerType extends Type {

    constructor(client) {

        super(client, {
            name: 'integer',
            prompt: {
                start: "Please input a valid integer.",
                retry: "That's not a valid integer, try again."
            }
        });

    }

    exec(input) {
        const int = parseInt(input);
        if(Number.isNaN(int)) return super.fail();
        return super.succeed(int);
    }


}

module.exports = IntegerType;
