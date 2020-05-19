const Command = require('../../interfaces/Command.js');

const emojis = require('../../../../util/emojis.json');
const { stripIndents } = require('common-tags'); 
const request = require('request-promise');

class VerifyCreateCommand extends Command {

    constructor(client) {

        super(client, {
            name: 'verify-create',
            description: "Verify your ROBLOX account to your Discord account.",
            guildOnly: true,
            aliases: [
                'verify'
            ],
            throttling: {
                usages: 1,
                duration: 15
            }
        });

    }

    async execute(message) {

        let sentMessage;
        try {
            sentMessage = await message.author.send(stripIndents`${emojis.loading} Welcome to the registration process for **Competitive Coalition**.
            I will guide you through the steps to connect your Discord account to your ROBLOX account.
            
            Please respond to this message with your ROBLOX account username __(case-sensitive)__.
            This prompt __will timeout after 30 seconds__.`);
        } catch(error) {
            await message.respond("I am unable to send you a direct message, enable them and proceed again.", { emoji: 'failure' });
            return undefined;
        }

        const response = await this._getResponse(message, sentMessage.channel);
        if(!response) return undefined;

        const user = await this._grabUser(message, sentMessage.channel, response);
        if(!user) return undefined;

        return await this._verifyUser(message, sentMessage.channel, user);

    }

    async _verifyUser(message, channel, user) {

        const code = new Date().getTime().toString(36);
        const embed = await this._embed(user);

        await channel.send(stripIndents`${emojis.loading} Is this your ROBLOX account? (__y__es, __n__o)
        This prompt __will timeout after 30 seconds__.`, { embed });
        const response = await this._getResponse(message, channel);

        if(!['yes', 'ye', 'y'].includes(response.content.toLowerCase())) {
            await message.respond(`${emojis.failure} Aborted prompt.`);
            return undefined;
        }

        await channel.send(stripIndents`${emojis.loading} To further verify that this is your account, you are required to put a verification code on your profile.
        Please put the code **\`${code}\`** into your ROBLOX bio, which you can change in the settings.
        <https://www.roblox.com/my/account#!/info>
        
        When finished, reply with a message to finish verification.
        This prompt __will timeout after 5 minutes__.`);

        const verification = await this._getResponse(message, channel, 300);
        if(!verification) return undefined;

        const bio = await this._grabBio(user.Id);
        if(!bio.includes(code)) {
            await channel.send(`${emojis.failure} I was unable to find the verification code in your profile, try again.`);
            return undefined;
        }
        
        await channel.send(`${emojis.success} Successfully linked your Discord account **${message.author.tag}** to your ROBLOX account **${user.Username}**.`);
        return await this.client.storageManager.tables['users']._addUser(message, {
            robloxUsername: user.Username,
            robloxId: user.Id
        });

    }

    async _grabUser(message, channel, response) {

        const username = response.content;

        const user = await this._checkRobloxUser(username);
        if(!user.Id) {
            await channel.send(`${emojis.failure} This ROBLOX account doesn't exist.`);
            return null;
        }

        const existing = await this.client.storageManager.tables['users']._grabRobloxUsername(user.Username)
        if(existing) {
            await channel.send(`${emojis.failure} This ROBLOX username is already registered to a Discord account.`);
            return null;
        }

        return user;

    }

    async _checkRobloxUser(username) {

        try {
            return await request({
                uri: `https://api.roblox.com/users/get-by-username?username=${username}`,
                json: true
            });
        } catch(e) {
            return false;
        }

    }

    async _getResponse(message, channel, seconds = 30) {

        let collected;

        try {
            collected = await channel.awaitMessages(m => m.author.id === message.author.id, {
                max: 1,
                time: seconds*1000,
                errors: ['time']
            });
        } catch(e) {
            channel.send(`${emojis.failure} Prompt timed out, try again.`);
            return null;
        }

        if(!collected) {
            channel.send(`${emojis.failure} An error occured, try again.`);
            return null;
        }
        return collected.first();

    }

    async _grabBio(id) {

        try {
            const result = await request({
                uri:`https://www.roblox.com/users/${id}/profile`,
                json: true
            });
            const description = result.split('<span class="profile-about-content-text linkify" ng-non-bindable>')[1].split('</span>', 1)[0];
            return description;
        } catch (e) {
            return '';
        }

    }

    async _embed(user) {

        const bio = await this._grabBio(user.Id);

        return {
            color: 0xe2251b,
            author: {
                name: `ROBLOX Profile`,
                icon_url: `https://cdn.discordapp.com/emojis/371785456863674380.png`
            },
            title: `${user.Username} (${user.Id})`,
            description: `${bio.length > 50 ? `${bio.substr(0, 50)}...`: ''}`,
            url: `https://www.roblox.com/users/${user.Id}/profile`,
            thumbnail: {
                url: `http://www.roblox.com/Thumbs/Avatar.ashx?x=100&y=100&format=png&username=${user.Username}`
            }
        };

    }

}

module.exports = VerifyCreateCommand;