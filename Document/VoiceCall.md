# Setup
- Before you use it, properly initialize the module (`@discordjs/voice` patch)

```js
new Client({
  patchVoice: true, // Enable default
})
```

# Usage: Call DM / Group DM

```js
const dmChannel = client.channels.cache.get('id');
/* or
const dmChannel = User.dmChannel || await User.createDM();
*/
const connection = await dmChannel.call();
/* Return @discordjs/voice VoiceConnection */
```

# Play Music using `play-dl`

```js
const play = require('play-dl');
const {
	createAudioPlayer,
	createAudioResource,
  NoSubscriberBehavior,
} = require('@discordjs/voice');
const channel = (await (message.member.user.dmChannel || message.member.user.createDM()));
const connection = channel.voiceConnection || await channel.call();
let stream;
if (!args[0]) {
	return message.channel.send('Enter something to search for.');
} else if (args[0].startsWith('https://www.youtube.com/watch?v=')) {
	stream = await play.stream(args.join(' '));
} else {
	const yt_info = await play.search(args, {
		limit: 1
	});
	stream = await play.stream(yt_info[0].url);
}
const resource = createAudioResource(stream.stream, {
	inputType: stream.type,
	inlineVolume: true,
});
resource.volume.setVolume(0.25);
const player = createAudioPlayer({
	behaviors: {
		noSubscriber: NoSubscriberBehavior.Play,
	},
});
let i = setInterval(() => {
	const m = channel.voiceUsers.get(message.author.id);
	if (m) {
		player.play(resource);
		connection.subscribe(player);
		clearInterval(i);
	}
	else console.log('waiting for voice connection');
}, 250);
```
