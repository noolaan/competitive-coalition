const CommandMessage = require('../interfaces/CommandMessage.js'); //eslint-disable-line
const Flag = require('../interfaces/Flag.js');

const { stripIndents } = require('common-tags');

class CommandHandler {

    constructor(client) {

        Object.defineProperty(this, 'client', { value: client });

        this.resolved = new Map();

    }

    async handle(message, command, args) {

        const commandMessage = new CommandMessage(this.client, {
            message,
            command
        });

        const inhibitors = await this.handleInhibitors(commandMessage);
        if(inhibitors && inhibitors.error) return this.resolveError({ error: true, code: 'INHIBITOR_ERROR', data: inhibitors, message: commandMessage });

        const info = await this.parseFlags(commandMessage, args);
        if(info.error) return this.resolveError(info);

        const resolved = await commandMessage._resolve(info);
        this.resolved.set(message.id, resolved);

        if(resolved.error) await this.resolveError(resolved);
        return resolved;

    }

    /* Flag & Parameter Parsing */

    async parseFlags(commandMessage, args) {

        const { command } = commandMessage;

        const flagExpansions = this._grabFlagExpansions(command.flags);
        const flags = {};
        const parameters = [];

        let flag;

        for(const arg of args) {
            const [ word, isQuote ] = arg;
            const flagObj = this._grabFlag(command, word, flagExpansions);

            if(flagObj && !isQuote && !flags[flagObj.id]) {
                flag = new Flag(this.client, commandMessage, flagObj);
                flags[flag.id] = flag;
            } else if(flag && flag.arguments) {
                flag.query = word;
                flag = null;
            } else {
                parameters.push(word);
            }

        }

        return await this._handleFlags(commandMessage, flags, parameters);

    }

    async parseArguments(any, type = 'NONE') {

        const splitFuncs = {
            'PLAIN': c => c.join(' ').split(' '),
            'QUOTED': c => c,
            'NONE': c => c.join(' ')
        };

        if(typeof type === 'function') return any.split(type);
        const blah = splitFuncs[type]
            ? splitFuncs[type](any)
            : any.split(type);

        return blah;

    }

    async _handleFlags(commandMessage, flags, parameters) {

        for(const flag of Object.values(flags)) {
            const response = await flag.parse();
            if(response.error) return response;
        }

        return { 
            error: false,
            args: await this.parseArguments(parameters, commandMessage.command.split),
            flags
        };

    }

    _grabFlag(command, word, flags) {
        if(word.charAt(0) !== '-') return null;
        let flagName = word.charAt(1) !== ''
            ? flags[word.slice(1)]
            : word.slice(2);

        if(!flagName) return null;
        return command.flags.filter(f=>f.id === flagName)[0] || null;
    }

    _grabFlagExpansions(flags) {
        let shortFlags = {};
        flags.map(f => shortFlags[f.id.charAt(0)] = f.id);
        return shortFlags;
    }

    /* Error Handling */

    async resolveError(info) {
        if(!info.error) return null;
        const code = Constants.ErrorMessages[info.code] ? info.code : 'COMMAND_ERROR';
        const message = Constants.ErrorMessages[code](info.data);

        if(info.message.pending) info.message.pending.edit(message, { emoji: 'failure' });
        else info.message.respond(message, { emoji: 'failure' });
    }

    /* Inhibitor Handling */

    async handleInhibitors({ message, command }) { //eslint-disable-line
        
        const inhibitors = this.client.registry.bases.filter(b=>!b.disabled && b.type === 'inhibitor');
        if(!inhibitors.size || inhibitors.size < 1) return undefined;

        const promises = [];

        for(const inhibitor of inhibitors.values()) {
            if(inhibitor.guild && !message.guild) continue;
            promises.push((async () => {
                let inhibited = inhibitor.run(message, command);
                if(inhibited instanceof Promise) inhibited = await inhibited;

                if(inhibited.error) return inhibited;
                return undefined;
            })());
        }

        const reasons = (await Promise.all(promises)).filter(r=>r);
        if(!reasons.length) return undefined;

        reasons.sort((a, b) => b.inhibitor.priority - a.inhibitor.priority);
        return reasons[0];

    }


}

module.exports = CommandHandler;

const Constants = {
    ErrorMessages: {
        COMMAND_ERROR: (data) => stripIndents`The command **${data.command.resolveable}** had issues executing. **\`[${data.UUID}]\`**
        Contact **the bot owner** about this issue. You can find support here: https://discord.gg/q2HMhds`,
        INHIBITOR_ERROR: (data) => `${data.message} **\`[${data.inhibitor.resolveable}]\`**`,
        FLAG_ERROR: ({ flag, message }) => `${message} **\`[flag:${flag.id}]\`**`
    }
};