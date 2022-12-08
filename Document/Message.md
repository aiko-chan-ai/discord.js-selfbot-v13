# Quick Links:
- [Interaction](https://github.com/aiko-chan-ai/discord.js-selfbot-v13/blob/main/Document/Message.md#interaction)
- [Embed](https://github.com/aiko-chan-ai/discord.js-selfbot-v13/blob/main/Document/Message.md#messageembed-)
- [Slash command demo](https://github.com/aiko-chan-ai/discord.js-selfbot-v13/blob/main/Document/SlashCommand.md)

## Interaction
<details open>
<summary>Button Click</summary>

```js
await Button.click(Message);
//
await message.clickButton(buttonID);
//
await message.clickButton(); // first button
//
await message.clickButton({ row: 0, col: 0})
```
</details>
<details open>
<summary>Message Select Menu</summary>

```js
await MessageSelectMenu.select(Message, options); // (v1)
// value: ['value1', 'value2' , ...]
await message.selectMenu(menuID, options) // If message has >= 2 menu
await message.selectMenu(options) // If message has 1 menu
```
</details>
<details open>
<summary>Slash Command</summary>

### [Click here](https://github.com/aiko-chan-ai/discord.js-selfbot-v13/blob/main/Document/SlashCommand.md)

</details>
<details open>
<summary>Message Context Command</summary>

```js
await message.contextMenu(botID, commandName);
```
</details>
<details open>

## MessageEmbed ?
- Because Discord has removed the ability to send Embeds in its API, that means MessageEmbed is unusable. But I have created a constructor that uses oEmbed with help [from this site](https://www.reddit.com/r/discordapp/comments/82p8i6/a_basic_tutorial_on_how_to_get_the_most_out_of/)

<details open>
<summary><strong>Click to show</strong></summary>


Code:
```js
const Discord = require('discord.js-selfbot-v13');
// Selfhost WebEmbed: https://github.com/aiko-chan-ai/WebEmbed
const w = new Discord.WebEmbed({
  shorten: true,
  hidden: false // if you send this embed with MessagePayload.options.embeds, it must set to false
  baseURL: '', // if you want self-host API, else skip :v
  shortenAPI: '', // if you want Custom shortenAPI (Method: Get, response: Text => URL), else skip :v
})
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
message.channel.send({ content: `Hello world`, embeds: [w] }) // Patched :)

```
### Features & Issues
- <strong>Only works with Discord Web and Discord Client (no custom theme installed)</strong>
- No Timestamp, Footer, Fields, Author iconURL
- Video with Embed working
- Can only choose between image and thumbnail
- Description limit 350 characters
- If you use hidden mode you must make sure your custom content is less than 1000 characters without nitro (because hidden mode uses 1000 characters + URL)

</details>
