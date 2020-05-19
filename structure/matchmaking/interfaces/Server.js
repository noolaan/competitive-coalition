const request = require('request-promise');

class Server {

    constructor(client, info = {}) {

        Object.defineProperty(this, 'client', { value: client });

        this.serverId = null;
        this.server = null;
        

    }

    async _createServer() {
        
        this.serverId = new Date().getTime().toString(36);
        const options = {
            uri: `secret-api`,
            method: 'GET',
            headers: {
                Authorization: "secret-auth"
            }
        };

        const response = await request(options);
        const server = JSON.parse(response);
        this.server = server.server;

        if(!server.success) {
            return {
                error: true,
                message: server.message
            };
        }

        return {
            error: false,
            message: server.message,
            server: this
        };

    }

    async _teleportUsers(users, teams) {
        
        console.log(users, teams);

        const options = {
            uri: `secret-api`,
            method: 'POST',
            json: {
                server: this.server,
                users,
                teams
            },
            headers: {
                Authorization: 'secret-auth'
            }
        };

        const response = await request(options);

    }

}

module.exports = Server;