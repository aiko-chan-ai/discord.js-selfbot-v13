## Voice Message
```js
        const channel = client.channels.cache.get('cid');
        const attachment = new Discord.MessageAttachment(
            './test.mp3', // path file
            'test.ogg', // must be .ogg
            {
                waveform: '=',
                duration_secs: 1, // any number you want
            },
        );
        channel.send({
            files: [attachment],
            flags: 'IS_VOICE_MESSAGE',
        });
```

## Interaction
<details open>
<summary>Slash Command</summary>

### [Click here](https://github.com/aiko-chan-ai/discord.js-selfbot-v13/blob/main/Document/SlashCommand.md)

</details>
<details open>

## MessageEmbed ?
- Because Discord has removed the ability to send Embeds in its API, that means MessageEmbed is unusable. But I have created a constructor that uses oEmbed with help [from this site](https://www.reddit.com/r/discordapp/comments/82p8i6/a_basic_tutorial_on_how_to_get_the_most_out_of/)

<details open>
<summary><strong>Click to show</strong></summary>


Code:
```js
const Discord = require('discord.js-selfbot-v13');
const w = new Discord.WebEmbed()
	.setAuthor({ name: 'hello', url: 'https://google.com' })
	.setColor('RED')
	.setDescription('description uh')
	.setProvider({ name: 'provider', url: 'https://google.com' })
	.setTitle('This is Title')
	.setURL('https://google.com')
	.setImage(
		'https://cdn.discordapp.com/attachments/820557032016969751/959093026695835648/unknown.png',
	)
	.setVideo(
		'https://cdn.discordapp.com/attachments/877060758092021801/957691816143097936/The_Quintessential_Quintuplets_And_Rick_Astley_Autotune_Remix.mp4',
	);
message.channel.send({ content: `Hello world ${Discord.WebEmbed.hiddenEmbed} ${w}` });

```
### Features & Issues
- <strong>Only works with Discord Web and Discord Client (no custom theme installed)</strong>
- No Timestamp, Footer, Fields, Author iconURL
- Video with Embed working
- Can only choose between image and thumbnail
- Description limit 350 characters
- If you use hidden mode you must make sure your custom content is less than 1000 characters without nitro (because hidden mode uses 1000 characters + URL)

</details>
