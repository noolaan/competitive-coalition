const path = require('path');

const Base = require('./Base.js');
const Command = require('./Command.js');
const Collection = require('../../../util/Collection.js');

class Module extends Base {

    constructor(client, opts = {}) {
        if(!opts) return null;

        super(client, {
            id: opts.name,
            type: 'module',
            disabled: opts.disabled,
            restricted: opts.restricted
        });

        Object.defineProperty(this, 'client', { value: client });

        this.commands = new Collection();
        this.commandsIndex = opts.commandsIndex;

        this.registerCommands();

    }

    async registerCommands() {

        const directory = path.join(process.cwd(), 'structure/client/commands/', this.commandsIndex);
        const files = this.client.registry.constructor.readdirRecursive(directory);

        const registered = [];
        
        for(const path of files) {
            const func = require(path);
            if(typeof func !== 'function') {
                this.client._log("Attempted to index an invalid function as a command.", { code: 'ERROR'});
                continue;
            }

            const command = new func(this.client);
            const register = await this.registerCommand(command, path);
            registered.push(register);
        }

        return registered;

    }

    async registerCommand(command, directory) {

        command.directory = directory;
        command.module = this;

        if(!(command instanceof Command)) {
            this.client._log(`Attempted to register an invalid command in ${this.resolveable}.`, { code: 'ERROR' });
            return null;
        }

        if(this.commands.has(command.moduleResolveable)) {
            this.client._log(`Attempted to reregister an existing command: ${command.moduleResolveable}`, { code: 'ERROR' });
            return null;
        }

        this.commands.set(command.moduleResolveable, command);

        return command;

    }

}

module.exports = Module;