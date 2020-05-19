// const { WebhookClient, MessageEmbed } = require('discord.js');

const chalk = require('chalk');
const moment = require('moment');

class Logger {

    constructor(client, opts = {}) {
        if(!opts) return null;
        
        this.client = client;
        // this.webhookClient = new WebhookClient(opts.webhook.id, opts.webhook.token);

        this.client
            .on('launch', (shard) => this.log(shard, { message: "Shard launched.", code: 'DEBUG' }))
            .on('message', (shard, message) => this.handleMessage(shard, message));

    }

    async handleMessage(shard, { message, code = 'LOG', embed = false }) { //eslint-disable-line

        if(!message) message = Constants.Messages[code] || "No message provided.";
        this.log(shard, { message, code });

        // if(embed) {
        //     await this.webhookClient.send('', new MessageEmbed({
        //         title: `${shard.displayId} ${code}`,
        //         description: Constants.Messages[code] || "No message provided.",
        //         footer: {
        //             text: `Ceres Status`
        //         },
        //         color: Constants.Colors[code] || 0x79bbcd,
        //         timestamp: new Date()
        //     }));
        // }

    }

    log(shard, { message, code }) {
        const prefix = this._formatPrefix(shard, code);
        return console.log(`${prefix} : ${message}`); //eslint-disable-line
    }

    _formatPrefix(shard, code) {
        const color = Constants.Colors[code];
        return `${chalk.hex(color)(`[${this.date}]`)} ${chalk.bold(shard.displayId)}`;
    }

    get date() {
        return moment().format("YYYY-MM-DD hh:mm:ssa");
    }

}

module.exports = Logger;

const Constants = {
    Messages: {
        CONNECT: "Shard **connected** to websocket.",
        RECONNECT: "Shard **reconnecting** from websocket.",
        DISCONNECT: "Shard **disconnected** from websocket."
    },
    Colors: {
        CONNECT: 0x89d682,
        RECONNECT: 0xf7e886,
        DISCONNECT: 0xe27a7a,
        ERROR: 0xe27a7a,
        WARN: 0xf7e886,
        DEBUG: 0xbf7fca,
        LOG: 0x79bbcd
    }
};