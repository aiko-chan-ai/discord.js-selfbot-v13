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
const connection = await message.member.user.dmChannel.call();
const play = require('play-dl');
const {
	createAudioPlayer,
	createAudioResource,
  NoSubscriberBehavior,
} = require('@discordjs/voice');
let stream = await play.stream('youtube link');
let resource = createAudioResource(stream.stream, {
	inputType: stream.type,
});
let player = createAudioPlayer({
	behaviors: {
		noSubscriber: NoSubscriberBehavior.Play,
	},
});
player.play(resource);
connection.subscribe(player);
```
