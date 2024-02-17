# Slash command

```js
TextBasedChannel.sendSlash(
    user: BotId (Snowflake) | User (User.bot === true),
    commandName: 'command_name [sub_group] [sub]',
    ...args: (string|number|boolean|FileLike|undefined)[],
): Promise<Message<true> | Modal>
```

## Basic

### Demo

![image](https://user-images.githubusercontent.com/71698422/173344527-86520c60-64cd-459c-ba3b-d35f14279f93.png)

### Code

```js
await channel.sendSlash('bot_id', 'aiko')
```

## Sub Command / Sub Group

### Demo

![image](https://user-images.githubusercontent.com/71698422/173346438-678009a1-870c-49a2-97fe-8ceed4f1ab64.png)

### Code test

```js
await channel.sendSlash('450323683840491530', 'animal chat', 'bye')
```

## Attachment

### Demo

![image](https://user-images.githubusercontent.com/71698422/173346964-0c44f91f-e5bf-43d4-8401-914fc3e92073.png)

### Code test

```js
const { MessageAttachment } = require('discord.js-selfbot-v13')
const fs = require('fs')
const a = new MessageAttachment(fs.readFileSync('./wallpaper.jpg') , 'test.jpg') 
await message.channel.sendSlash('718642000898818048', 'sauce', a)
```

### Result

![image](https://user-images.githubusercontent.com/71698422/173347075-5c8a1347-3845-489e-956b-63975911b6e0.png)

## Skip options

### Demo Command

![image](https://cdn.discordapp.com/attachments/820557032016969751/1196038273282355301/image.png)

![image](https://cdn.discordapp.com/attachments/820557032016969751/1196038366328799242/image.png)

![image](https://cdn.discordapp.com/attachments/820557032016969751/1196040186186973238/image.png)

![image](https://cdn.discordapp.com/attachments/820557032016969751/1196041814147338360/image.png)

### Code
```js
	const channel = client.channels.cache.get('channel_id');
	const response = await channel.sendSlash(
		'bot_id',
		'image make',
		'MeinaMix - v11',
		'Phone (9:16) [576x1024 | 810x1440]',
		'2', // String choices, not number
		undefined, // VAE
		undefined, // sdxl_refiner
		undefined, // sampling_method,
		30,
	);
	// Submit Modal
	if (!response.isMessage) { // Modal
		response.components[0].components[0].setValue(
			'1girl, brown hair, green eyes, colorful, autumn, cumulonimbus clouds',
		);
		response.components[1].components[0].setValue(
			'(worst quality:1.4), (low quality:1.4), (normal quality:1.4), (ugly:1.4), (bad anatomy:1.4), (extra limbs:1.2), (text, error, signature, watermark:1.2), (bad legs, incomplete legs), (bad feet), (bad arms), (bad hands, too many hands, mutated hands), (zombie, sketch, interlocked fingers, comic, morbid), cropped, long neck, lowres, missing fingers, missing arms, missing legs, extra fingers, extra digit, fewer digits, jpeg artifacts',
		);
		await response.reply();
	}

```

### Receive messages after bot has replied `{botname} is thinking...`

> [aiko-chan-ai/discord.js-selfbot-v13#1055 (comment)](https://github.com/aiko-chan-ai/discord.js-selfbot-v13/issues/1055#issuecomment-1949653100)

![image](https://cdn.discordapp.com/attachments/820557032016969751/1208363574477590538/image.png?ex=65e30346&is=65d08e46&hm=72771d6aa0d23f817f5daf8d2f33906ff74200aace7787c3cd02d2e30e58f8d5&)

```js
const channel = client.channels.cache.get('id');
channel
	.sendSlash('289066747443675143', 'osu', 'Accolibed')
	.then(async (message) => {
		if (message.flags.has('LOADING')) { // owo is thinking...
			return new Promise((r, rej) => {
				let t = setTimeout(() => rej('timeout'), 15 * 60 * 1000); // 15m (DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE)
				message.client.on('messageUpdate', (_, m) => {
					if (_.id == message.id) {
						clearTimeout(t);
						r(m);
					}
				});
			});
		} else {
			return Promise.resolve(message);
		}
	})
	.then(console.log);
```