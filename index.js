const settings = require('./settings.json');
const BaseClient = require('./middleware/BaseClient.js');

new BaseClient('./structure/client/DiscordClient.js', settings)
    .initialize();