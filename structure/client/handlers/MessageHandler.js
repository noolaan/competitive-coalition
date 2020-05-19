const Collection = require('../../../util/Collection.js');
const escapeRegex = require('escape-string-regexp');

class MessageHandler {

    constructor(client) {

        Object.defineProperty(this, 'client', { value: client });

        this.quotePairs = {
            '"': '"',
            "'": "'",
            '‘': '’'
        };

        this.startQuotes = Object.keys(this.quotePairs);
        this.quoteMarks = this.startQuotes + Object.values(this.quotePairs)
            .join('');
        
        this.messageCache = new Collection();
        this.commandPatterns = new Map();

    }

    async handle(message) {

        if(!this.client._built) return null;

        if(message.webhookID
            || message.author.bot
            || (message.guild && !message.guild.available)) return null;

        if(!message.member && message.guild) {
            await message.guild.members.fetch(message.author.id);
        }

        const args = message.content.split(' ');
        const command = await this.getCommand(message, args);
        if(!command) return null;

        return await this.client.commandHandler.handle(message, command, this.getWords(args.join(' ')));

    }

    async getCommand(message, args = []) {

        const pattern = await this.getCommandPattern(message.guild);

        let command = await this.matchCommand(message, args, pattern, 2);
        if(!command && !message.guild) command = await this.matchCommand(message, args, /^([^\s]+)/i);
        return command || null;

    }

    async matchCommand({ content }, args, pattern, index = 1) {

        const matches = pattern.exec(content);
        if(!matches) return null;

        const command = this.client.resolver.base(matches[index], 'command', true);
        if(!command) return null;

        const amount = content.startsWith('<@') ? 2 : 1;
        args.splice(0, amount);

        return command;

    }

    async getCommandPattern(guild = null) {

        if(!guild) return this.createCommandPattern().pattern;
        let commandPattern = this.commandPatterns.get(guild.id);
        if(commandPattern){
            if(guild && guild.settings && guild.settings.prefix 
                && (commandPattern.prefix !== guild.settings.prefix.value)) {
                    commandPattern = this.createCommandPattern(guild);
            }
        } else {
            commandPattern = this.createCommandPattern(guild);
        }

        return commandPattern.pattern;

    }

    createCommandPattern(guild) {

        let prefix = this.client._settings.defaultPrefix;
        if(guild && guild.settings && guild.settings.prefix) prefix = guild.settings.prefix.value;

        const escapedPrefix = escapeRegex(prefix);
        const pattern = new RegExp(`^(${escapedPrefix}\\s*|<@!?${this.client.user.id}>\\s+(?:${escapedPrefix})?)([^\\s]+)`, 'i');

        const obj = { pattern, prefix };
        if(guild) this.commandPatterns.set(guild.id, obj);

        if(guild) this.client._log(`Created command pattern in guild ${guild.name}: ${pattern}`, { code: 'DEBUG' });
        return obj;

    }

    getWords(string = '') {

        let quoted = false,
            wordStart = true,
            startQuote = '',
            endQuote = false,
            isQuote = false,
            word = '',
            words = [],
            chars = string.split('');
    
        chars.forEach((char) => {
            if(/\s/.test(char)) {
                if(endQuote) {
                    quoted = false;
                    endQuote = false;
                    isQuote = true;
                }
                if(quoted) {
                    word += char;
                } else if(word !== '') {
                    words.push([ word, isQuote ]);
                    isQuote = false;
                    startQuote = '';
                    word = '';
                    wordStart = true;
                }
            } else if(this.quoteMarks.includes(char)) {
                if (endQuote) {
                    word += endQuote;
                    endQuote = false;
                }
                if(quoted) {
                    if(char === this.quotePairs[startQuote]) {
                        endQuote = char;
                    } else {
                        word += char;
                    }
                } else if(wordStart && this.startQuotes.includes(char)){
                    quoted = true;
                    startQuote = char;
                } else {
                    word += char;
                }
            } else {
                if(endQuote) {
                    word += endQuote;
                    endQuote = false;
                }
                word += char;
                wordStart = false;
            }
        });
    
        if (endQuote) {
            words.push([ word, true ]);
        } else {
            word.split(/\s/).forEach((subWord, i) => {
                if (i === 0) {
                    words.push([ startQuote+subWord, false ]);
                } else {
                    words.push([ subWord, false ]);
                }
            });
        }
        
        return words;
    
    }

}

module.exports = MessageHandler;