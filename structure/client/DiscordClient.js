const { Client } = require('discord.js');

const Registry = require('./Registry.js');
const MessageHandler = require('./handlers/MessageHandler.js');
const CommandHandler = require('./handlers/CommandHandler.js');
const ReactionHandler = require('./handlers/ReactionHandler.js');

const MatchManager = require('../matchmaking/MatchManager2.js');

const Logger = require('./Logger.js');
const EventHooker = require('../../util/EventHooker.js');
const StorageManager = require('./storage/StorageManager.js');
const Resolver = require('./Resolver.js');

const { Guilds, Users } = require('./storage/tables/');
const { Module, Type, Inhibitor } = require('./interfaces/'); //eslint-disable-line

const settings = require('../../settings.json');
const emojis = require('../../util/emojis.json');

class DiscordClient extends Client {

    constructor() {

        super(settings.clientOptions);

        this._settings = settings;

        this.registry = new Registry(this);
        this.messageHandler = new MessageHandler(this);
        this.commandHandler = new CommandHandler(this);
        this.reactionHandler = new ReactionHandler(this);

        this.matchManager = new MatchManager(this);

        this.logger = new Logger(this);
        this.storageManager = new StorageManager(this, { name: 'cc' });
        this.eventHooker = new EventHooker(this);
        this.resolver = new Resolver(this);

        this._emojis = emojis;
        this._built = false;

    }

    async build() {

        if(this._built) return null;

        await this.registry.registerBases('modules', Module);
        await this.registry.registerBases('types', Type);
        await this.registry.registerBases('inhibitors', Inhibitor);
        await super.login(this._settings.token);
        await this._handleReady();

        await this.storageManager.createTables([
            ['guilds', Guilds],
            ['users', Users]
        ]);

        this.eventHooker.hook('message', this.messageHandler.handle.bind(this.messageHandler));
        this.eventHooker.hook('messageReactionAdd', this.reactionHandler.handleAdd.bind(this.reactionHandler));
        this.eventHooker.hook('messageReactionRemove', this.reactionHandler.handleRemove.bind(this.reactionHandler));

        this._built = true;

    }

    async _handleReady() {
        //Cache Reaction Message
        const channel = this.channels.resolve("448343928001921034");
        await channel.messages.fetch("448710158651097088");
    }
    

    _log(message, opts = {}) {
        if(!opts) return null;
        this.logger.send(message, opts);
    }

}

module.exports = DiscordClient;

new DiscordClient().build();