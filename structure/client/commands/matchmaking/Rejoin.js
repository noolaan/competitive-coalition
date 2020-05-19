const Command = require('../../interfaces/Command.js');
const request = require('request-promise');
const { stripIndents } = require('common-tags');

class RejoinCommand extends Command {

    constructor(client) {

        super(client, {
            name: 'rejoin',
            description: "Rejoins a match if you were in one; requires you to be in a server.",
            split: 'NONE'
        });

        this.matchManager = this.client.matchManager;

    }

    async execute(message, { args }) {

        const matchId = parseInt(args);
        if(Number.isNaN(matchId)) return message.respond(`Please provide the match ID you were previously in.`, { emoji: 'failure' });

        const match = this.client.matchManager.matches.get(matchId);
        if(!match) {
            return message.respond(`Unable to find a match with that ID.`, { emoji: 'failure' });
        }

        const user = match.users.filter(u=>u.member.id === message.author.id)[0];
        if(!user) {
            return message.respond(`You're not a player in that match.`, { emoji: 'failure' });
        }

        const response = await request({
            uri: `secret-api`,
            method: 'GET',
            headers: {
                Authorization: 'secret-auth'
            }
        });

        const data = JSON.parse(response);
        if(!data.success || !data.ingame) {
            return message.respond(stripIndents`You must be in a Phantom Forces server to rejoin the match.
                Join with this link: <https://www.roblox.com/games/292439477/Phantom-Forces>.`, { emoji: 'failure' });
        }


        const team = user.team === 'PHANTOMS' ? 0 : 1;
        const teams = {};
        teams[user.robloxId] = team;

        const options = {
            uri: `secret-api`,
            method: 'POST',
            json: {
                server: match.server,
                users: [ user.robloxId ],
                teams
            },
            headers: {
                Authorization: 'secret-auth'
            }
        };

        await request(options);
        message.respond(`Successfully teleported you to the match, it may take a few seconds.`, { emoji: 'success' });
        
    }

}

module.exports = RejoinCommand;