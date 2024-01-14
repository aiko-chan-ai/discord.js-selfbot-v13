const { Client } = require('../src/index');
const client = new Client();

client.on('ready', async () => {
  console.log(`${client.user.username} is ready!`);
});

client.on("messageCreate", message => {
    if (message.content == 'ping') {
        message.reply('pong');
    }
});

client.login('token');
