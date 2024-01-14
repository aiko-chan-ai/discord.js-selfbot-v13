const { Client } = require('../src/index');
const client = new Client();

client.on('ready', async () => {
  console.log(`${client.user.username} is ready!`);
  const channel = client.channels.cache.get('id');
  channel.send({
    activity: {
      type: 3, // MessageActivityType.Listen
      partyId: `spotify:${client.user.id}`,
    },
  });
});

client.login('token');
