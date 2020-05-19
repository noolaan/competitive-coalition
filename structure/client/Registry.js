const Collection = require('../../util/Collection.js');
const path = require('path');
const fs = require('fs');

const Base = require('../client/interfaces/Base.js');

class Registry {

    constructor(client, opts = {}) {
        if(!opts) return null;

        Object.defineProperty(this, 'client', { value: client });

        this.bases = new Collection();

    }

    async registerBases(dir, classToHandle = null) {
        const directory = path.join(process.cwd(), 'structure/client/', dir);
        const files = this.constructor.readdirRecursive(directory);

        const registered = [];

        for(const path of files) {
            const func = require(path);
            if(typeof func !== 'function') {
                this.client._log("Attempted to index an invalid function as a base.", { code: 'ERROR' });
                continue;
            }

            const base = new func(this.client);
            registered.push(await this.registerBase(base, path, classToHandle));
        }

        return registered;

    }

    async registerBase(base, directory, classToHandle) {

        if(!(base instanceof Base)) {
            this.client._log("Attempted to register an invalid base.", { code: 'ERROR' });
            return null;
        }

        if(classToHandle && !(base instanceof classToHandle)) {
            this.client._log("Attempted to register an invalid class.", { code: 'ERROR' });
            return null;
        }

        if(this.bases.has(base.resolveable)) {
            this.client._log("Attempted to reregister an existing base.", { code: 'ERROR' });
            return null;
        }
        
        base.directory = directory;

        this.bases.set(base.resolveable, base);

        return base;

    }

    get commands() {
        const modules = this.bases.filter(b=>b.type === 'module');
        const commands = [];
        for(const mod of modules.values()) {
            for(const command of mod.commands.values()) commands.push(command);
        }
        return commands;
    }

    static readdirRecursive(directory) {

        const result = [];

        (function read(directory) {
            const files = fs.readdirSync(directory);
            for (const file of files) {
                const filePath = path.join(directory, file);

                if (fs.statSync(filePath).isDirectory()) {
                    read(filePath);
                } else {
                    result.push(filePath);
                }
            }
        }(directory));

        return result;

    }

}

module.exports = Registry;