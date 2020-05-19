const ShardManager = require('./interfaces/ShardManager.js');
const Logger = require('./Logger.js');

class BaseClient extends ShardManager {

        constructor(file, opts = {}) {
            if(!opts) return null;

            super(file, { 
                totalShards: opts.sharding.totalShards,
                respawn: opts.sharding.respawn
            });

            this.logger = new Logger(this, opts.sharding);
            this._options = opts;

        }

    async initialize() {

        return await this.spawn(this.totalShards);

    }

}

module.exports = BaseClient;