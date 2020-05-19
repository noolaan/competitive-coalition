const rethinkdb = require('rethinkdbdash');

class StorageManager {

    constructor(client, opts) {
        if(!opts) return null;

        Object.defineProperty(this, 'client', { value: client });

        this.database = new rethinkdb({
            silent: true,
            log: (message) => this.log(message, { error: false })
        });
        
        this.name = opts.name;
        this.tables = {};

    }

    async createTables(tables) {
        for(const [ index, obj ] of tables) {
            const table = await new obj(this.client, {
                r: this.database,
                name: this.name,
                index
            }).initialize();
            this.tables[index] = table;
        }
    }

    log(message, options = {}) {
        this.client.logger.send(message, { 
            header: 'DATABASE', 
            code: options.error ? 'ERROR' : 'LOG' 
        });
    } 

}

module.exports = StorageManager;