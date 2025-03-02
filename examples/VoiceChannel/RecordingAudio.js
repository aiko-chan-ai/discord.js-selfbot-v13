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
const Speaker = require('speaker');

client.on('ready', async client => {
  console.log(`${client.user.username} is ready!`);

  const speaker = new Speaker({
    channels: 2, // 2 channels
    bitDepth: 16, // 16-bit samples
    sampleRate: 48000, // 48000 Hz sample rate
  });

  const channel = client.channels.cache.get('voice_id');
  const connection = await client.voice.joinChannel(channel, {
    selfMute: true,
    selfDeaf: true,
    selfVideo: false,
  });

  const audio = connection.receiver.createStream('user_id', {
    mode: 'pcm',
    end: 'manual',
    paddingSilence: true,
  });

  audio.pipe(fs.createWriteStream('test.pcm'));

  // After 15s
  setTimeout(() => {
    console.log('Stop recording');
    audio.destroy();
    // Play this record...
    fs.createReadStream('test.pcm').pipe(speaker);
  }, 15_000);
});


client.login('token');
