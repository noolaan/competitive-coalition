const Module = require('../interfaces/Module.js');

class VerificationModule extends Module {

    constructor(client) {

        super(client, {
            name: 'verification',
            commandsIndex: 'verification'
        });

        Object.defineProperty(this, 'client', { value: client });

    }

}

module.exports = VerificationModule;