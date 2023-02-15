## Setup
```js
const client = new Client({
  syncStatus: false,
});
```

## Custom Status and RPC

<strong>Custom Status</strong>

```js
const Discord = require('discord.js-selfbot-v13');
const r = new Discord.CustomStatus()
	.setState('Discord')
	.setEmoji('💬')
client.user.setActivity(r);
```

<img src='https://cdn.discordapp.com/attachments/820557032016969751/994318117243203758/unknown.png'>

Rich Presence [Custom]
```js
const Discord = require('discord.js-selfbot-v13');
const r = new Discord.RichPresence()
	.setApplicationId('817229550684471297')
	.setType('STREAMING')
	.setURL('https://youtube.com/watch?v=dQw4w9WgXcQ')
	.setState('State')
	.setName('Name')
	.setDetails('Details')
	.setParty({
		max: 9,
		current: 1,
		id: Discord.getUUID(),
	})
	.setStartTimestamp(Date.now())
	.setAssetsLargeImage('929325841350000660')
	.setAssetsLargeText('Youtube')
	.setAssetsSmallImage('895316294222635008')
	.setAssetsSmallText('Bot')
	.addButton('name', 'https://link.com/')
client.user.setActivity(r);
```
<img src='https://cdn.discordapp.com/attachments/820557032016969751/994300662378676264/unknown.png'>

Rich Presence with Spotify
```js
const Discord = require('discord.js-selfbot-v13');
const r = new Discord.SpotifyRPC(client)
        .setAssetsLargeImage("spotify:ab67616d00001e02768629f8bc5b39b68797d1bb") // Image ID
        .setAssetsSmallImage("spotify:ab6761610000f178049d8aeae802c96c8208f3b7") // Image ID
        .setAssetsLargeText('未来茶屋 (vol.1)') // Album Name
        .setState('Yunomi; Kizuna AI') // Artists
        .setDetails('ロボットハート') // Song name
        .setStartTimestamp(Date.now())
        .setEndTimestamp(Date.now() + 1_000 * (2 * 60 + 56)) // Song length = 2m56s
        .setSongId('667eE4CFfNtJloC6Lvmgrx') // Song ID
        .setAlbumId('6AAmvxoPoDbJAwbatKwMb9') // Album ID
        .setArtistIds('2j00CVYTPx6q9ANbmB2keb', '2nKGmC5Mc13ct02xAY8ccS') // Artist IDs
client.user.setActivity(r);
```
<img src='https://cdn.discordapp.com/attachments/820557032016969751/994512257914515456/unknown.png'>
<img src='https://cdn.discordapp.com/attachments/820557032016969751/994512258128420944/unknown.png'>


<strong>You can now add custom images for RPC !</strong>

> Tutorial:

## Method 1:

+ Step 1: Send image to Discord

<img src='https://cdn.discordapp.com/attachments/820557032016969751/995297572732284968/unknown.png'>

+ Step 2: Get Image URL

<img src='https://cdn.discordapp.com/attachments/820557032016969751/995298082474426418/unknown.png'>

```sh
Demo URL: https://cdn.discordapp.com/attachments/820557032016969751/991172011483218010/unknown.png
```

+ Step 3: Replace `https://cdn.discordapp.com/` or `https://media.discordapp.net/` with `mp:`

```diff
- https://cdn.discordapp.com/attachments/820557032016969751/991172011483218010/unknown.png

- https://media.discordapp.net/attachments/820557032016969751/991172011483218010/unknown.png

+ mp:attachments/820557032016969751/991172011483218010/unknown.png

```

+ Step 4:

```js
const Discord = require('discord.js-selfbot-v13');
const r = new Discord.RichPresence()
	.setApplicationId('817229550684471297')
	.setType('PLAYING')
	.setURL('https://youtube.com/watch?v=dQw4w9WgXcQ')
	.setState('State')
	.setName('Name')
	.setDetails('Details')
	.setParty({
		max: 9,
		current: 1,
		id: Discord.getUUID(),
	})
	.setStartTimestamp(Date.now())
	.setAssetsLargeImage('mp:attachments/820557032016969751/991172011483218010/unknown.png')
	.setAssetsLargeText('Youtube')
	.setAssetsSmallImage('895316294222635008')
	.setAssetsSmallText('Bot')
	.addButton('name', 'https://link.com/')
client.user.setActivity(r);
```

## Method 2: (Discord URL, 2.3.78+)

```js
const Discord = require('discord.js-selfbot-v13');
const r = new Discord.RichPresence()
	.setApplicationId('817229550684471297')
	.setType('PLAYING')
	.setURL('https://youtube.com/watch?v=dQw4w9WgXcQ')
	.setState('State')
	.setName('Name')
	.setDetails('Details')
	.setParty({
		max: 9,
		current: 1,
		id: Discord.getUUID(),
	})
	.setStartTimestamp(Date.now())
	.setAssetsLargeImage('https://cdn.discordapp.com/attachments/820557032016969751/991172011483218010/unknown.png')
	.setAssetsLargeText('Youtube')
	.setAssetsSmallImage('895316294222635008')
	.setAssetsSmallText('Bot')
	.addButton('name', 'https://link.com/')
client.user.setActivity(r);
```

<img src='https://cdn.discordapp.com/attachments/820557032016969751/995301015257616414/unknown.png'>

## Method 3 (Custom URL, 2.3.78+)

```js
const Discord = require('discord.js-selfbot-v13');
const rpc = new Discord.RichPresence();
const imageSet = await Discord.RichPresence.getExternal(client, '820344593357996092', 'https://musedash.moe/covers/papipupipupipa_cover.hash.93ae31d41.png', 'https://musedash.moe/covers/lights_of_muse_cover.hash.1c18e1e22.png')
rpc
	.setApplicationId('820344593357996092')
	.setType('PLAYING')
	.setState('pa pi pu pi pu pi pa - ころねぽち With 立秋')
	.setName('Muse Dash')
	.setDetails('Hard - Lvl.8')
	.setAssetsLargeImage(imageSet[0].external_asset_path)
	.setAssetsSmallImage(imageSet[1].external_asset_path)
client.user.setActivity(rpc);
```

<img src='https://cdn.discordapp.com/attachments/820557032016969751/997781209998434355/unknown.png'>

<strong>How to get the Assets ID and Name of the bot (application) ?</strong>

- Bot:
```js
const bot = await client.users.fetch('BotId');
const asset = await bot.application.fetchAssets();
// asset: Array<ApplicationAsset>
// Document: https://discordjs-self-v13.netlify.app/#/docs/docs/main/typedef/ApplicationAsset
```
<img src='https://cdn.discordapp.com/attachments/820557032016969751/995307830028550204/unknown.png'>

- Application
> Using Browser (Chrome) with URL: `https://discord.com/api/v9/oauth2/applications/{applicationId}/assets`
<img src='https://cdn.discordapp.com/attachments/820557032016969751/995307606115618926/unknown.png'>

- More: 
  - You can change the status 5 times / 20 seconds!
