// https://v12.discordjs.guide/voice/receiving-audio.html#basic-usage

/*
Install:
- An Opus library: @discordjs/opus or opusscript
- An encryption packages:
  + sodium (best performance)
  + libsodium-wrappers
  + @stablelib/xchacha20poly1305
- ffmpeg (install and add to your system environment)
*/

const { Client } = require('../../src/index');
const client = new Client();

const fs = require('fs');

client.on('ready', async client => {
  console.log(`${client.user.username} is ready!`);

  const channel = client.channels.cache.get('voice_id');
  const connection = await client.voice.joinChannel(channel, {
    selfMute: true,
    selfDeaf: true,
    selfVideo: false,
  });

  const connectionStream = await connection.joinStreamConnection('user_id');

  const video = connectionStream.receiver.createVideoStream('user_id', fs.createWriteStream('video.mkv')); // Output file using matroska container

  video.on('ready', () => {
    console.log('FFmpeg process ready!');
    video.stream.stderr.on('data', data => {
      console.log(`FFmpeg: ${data}`);
    });
  });

  // After 15s
  setTimeout(() => {
    video.destroy();
  }, 15_000);
});

client.login('token');
