/*
Credit: https://github.com/dank074/Discord-video-stream
The use of video streaming in this library is an incomplete implementation with many bugs, primarily aimed at lazy users.
The video streaming features in this library are sourced from https://github.com/dank074/Discord-video-stream.

Please use the @dank074/discord-video-stream library to access all advanced and professional features,
along with comprehensive support. I will not actively fix bugs related to streaming and encourage everyone to
use https://github.com/dank074/Discord-video-stream for stable and smooth streaming.

To reiterate: This is an incomplete implementation of the library https://github.com/dank074/Discord-video-stream.

Thanks to dank074 and longnguyen2004 for implementing new codecs (H264, H265).
Thanks to mrjvs for discovering how Discord transmits data and the VP8 codec.

Please use the @dank074/discord-video-stream library for the best support.
*/

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

client.on('ready', async client => {
  console.log(`${client.user.username} is ready!`);
  const channel = client.channels.cache.get('voice_channel');
  const connection = await client.voice.joinChannel(channel, {
    selfMute: true,
    selfDeaf: true,
    selfVideo: false, // Turn on the camera? If you turn on the camera, use the connection similar to
    // PlayAudio.js, and it will stream video through the camera. This is an implementation of screen sharing.
    videoCodec: 'H264',
  });
  const stream = await connection.createStreamConnection();
  // You can also access it by using `connection.streamConnection` (only after it has been initialized by the `createStreamConnection` function).
  // Split it into two separate streams (audio / video)
  // Or with a combined stream that will be automatically processed by FFmpeg.
  const input = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  // Play
  const dispatcher = stream.playVideo(input, {
    fps: 60,
    bitrate: 4000,
  });
  const dispatcher2 = stream.playAudio(input);
  dispatcher.on('start', () => {
    console.log('video is now playing!');
  });

  dispatcher.on('finish', () => {
    console.log('video has finished playing!');
  });
  dispatcher.on('error', console.error);

  dispatcher2.on('start', () => {
    console.log('audio is now playing!');
  });

  dispatcher2.on('finish', () => {
    console.log('audio has finished playing!');
  });
  dispatcher2.on('error', console.error);
  // Of course, you can also pause the stream using the `pause` function, but remember to pause both video and audio.
});

client.login('token');
