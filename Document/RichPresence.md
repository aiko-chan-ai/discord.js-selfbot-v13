## Custom Status and RPC

<details open>
<summary><strong>Click to show</strong></summary>
Custom Status

```js
const r = new Discord.CustomStatus()
	.setState('Discord')
	.setEmoji('💬')
client.user.setActivity(r.toJSON());
```

<img src='https://cdn.discordapp.com/attachments/820557032016969751/994318117243203758/unknown.png'>

Rich Presence [Custom]
```js
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
client.user.setActivity(r.toJSON());
```
<img src='https://cdn.discordapp.com/attachments/820557032016969751/994300662378676264/unknown.png'>

Rich Presence with Spotify
```js
const r = new Discord.SpotifyRPC(client)
	.setAssetsLargeImage("spotify:ab67616d00001e02768629f8bc5b39b68797d1bb") // Image ID
	.setAssetsSmallImage("spotify:ab6761610000f178049d8aeae802c96c8208f3b7") // Image ID
	.setAssetsLargeText('未来茶屋 (vol.1)') // Album Name
	.setState('Yunomi; Kizuna AI') // Author
	.setDetails('ロボットハート') // Song name
	.setStartTimestamp(Date.now())
	.setEndTimestamp(Date.now() + 1_000 * (2 * 60 + 56)) // Song length = 2m56s
	.setSongId('667eE4CFfNtJloC6Lvmgrx'); // Song ID
client.user.setActivity(r.toJSON());
```
<img src='https://cdn.discordapp.com/attachments/820557032016969751/994512257914515456/unknown.png'>
<img src='https://cdn.discordapp.com/attachments/820557032016969751/994512258128420944/unknown.png'>



<strong>New: You can now add custom images for RPC !</strong>
> Tutorial:

+ Step 1: Send photos by embed.thumbnail

```js
const embed = new MessageEmbed().setThumbnail('image url');
const msg = await channel.send({ embeds: [embed] });
```
+ Step 2: Get proxyURL from message.embeds[0].thumbnail.proxyURL

```js
const proxyURL = msg.embeds[0].thumbnail.proxyURL;
```
+ Step 3: Put the URL in the constructor

```js
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
	.setAssetsLargeImage(proxyURL)
	.setAssetsLargeText('Youtube')
	.setAssetsSmallImage('895316294222635008')
	.setAssetsSmallText('Bot')
	.addButton('name', 'https://link.com/')
client.user.setActivity(r.toDiscord().game);
```

And you can change the status 5 times every 20 seconds!
</details>
