// Join a voice channel and do nothing

const { Client } = require('../../src/index');
const client = new Client();

client.on('ready', async () => {
  console.log(`${client.user.username} is ready!`);
  const channel = client.channels.cache.get('voice_channel');
  const connection = await client.voice.joinChannel(channel, {
    selfMute: true,
    selfDeaf: true,
    selfVideo: false,
  });
  // Leave voice
  setTimeout(() => {
    connection.disconnect();
  }, 5_000);
});

client.login('token');
