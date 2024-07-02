const { Client, MessageAttachment } = require('../src/index');
const client = new Client();

client.on('ready', async () => {
  console.log(`${client.user.username} is ready!`);
  const channel = client.channels.cache.get('channel_id');
  const attachment = new MessageAttachment(
    './test.mp3', // path file
    'random_file_name.ogg', // must be .ogg
    {
      waveform: 'AAAAAAAAAAAA',
      duration_secs: 1, // any number you want
    },
  );
  channel.send({
    files: [attachment],
    flags: 'IS_VOICE_MESSAGE',
  });
});

client.login('token');
