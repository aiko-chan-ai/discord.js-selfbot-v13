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

![image](https://github.com/user-attachments/assets/e7b8fc6c-4816-49df-a400-6a4eed7a9a88)
![image](https://github.com/user-attachments/assets/3452f388-639b-4626-a826-56ec3683ee32)
![image](https://github.com/user-attachments/assets/4a1e92d7-402d-4087-afa7-5794ce8ba6eb)
![image](https://github.com/user-attachments/assets/85b029f4-27f7-4e20-b3a7-a4d0597b4a98)

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

![image](https://github.com/user-attachments/assets/0a1d253a-7751-4f63-a750-58b50d055928)

```js
const channel = client.channels.cache.get('id');
channel
    .sendSlash('289066747443675143', 'osu', 'Accolibed')
    .then(async (message) => {
        if (message.flags.has('LOADING')) { // owo is thinking...
            return new Promise((resolve, reject) => {
                let done = false;
                const timeout = setTimeout(() => {
                    if (!done) {
                        done = true;
                        client.off('messageUpdate', onUpdate);
                        reject('timeout');
                    }
                }, 15 * 60 * 1000);  // 15m (DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE)

                function onUpdate(_, m) {
                    if (_.id === message.id) {
                        if (!done) {
                            done = true;
                            clearTimeout(timeout);
                            client.off('messageUpdate', onUpdate);
                            resolve(m);
                        }
                    }
                }
                client.on('messageUpdate', onUpdate);
            });
        } else {
            return Promise.resolve(message);
        }
    })
    .then(console.log);
```
