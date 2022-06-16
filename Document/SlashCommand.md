# Slash command demo 
- Unsupport Autocomplete feature (maybe)
- Unused `guild.searchInteraction()` (Use only if not working properly)

# Slash Command (no options)

### Demo

![image](https://user-images.githubusercontent.com/71698422/173344527-86520c60-64cd-459c-ba3b-d35f14279f93.png)

`vietnamese .-.`

### Code test

```js
await message.channel.sendSlash('botid', 'aiko')
// Return nonce (view document)
```

### Result

![image](https://user-images.githubusercontent.com/71698422/173346835-c747daa5-cd99-41df-9d28-fecf3b7e1ac9.png)

# Slash Command + Sub option (group)

### Demo

![image](https://user-images.githubusercontent.com/71698422/173346438-678009a1-870c-49a2-97fe-8ceed4f1ab64.png)

### Code test

```js
await message.channel.sendSlash('450323683840491530', 'animal', 'chat', 'bye')
// Return nonce (view document)
```

### Result

![image](https://user-images.githubusercontent.com/71698422/173346620-ba54f0d8-efc6-4f40-9093-34feda171a3c.png)

# Slash Command with Attachment (must use MessageAttachment)

### Demo

![image](https://user-images.githubusercontent.com/71698422/173346964-0c44f91f-e5bf-43d4-8401-914fc3e92073.png)

### Code test

```js
const { MessageAttachment } = require('discord.js-selfbot-v13')
const fs = require('fs')
const a = new MessageAttachment(fs.readFileSync('./wallpaper.jpg') , 'test.jpg') 
await message.channel.sendSlash('718642000898818048', 'sauce', a)
// Return nonce (view document)
```

### Result

![image](https://user-images.githubusercontent.com/71698422/173347075-5c8a1347-3845-489e-956b-63975911b6e0.png)

# Events

- [interactionCreate](https://discordjs-self-v13.netlify.app/#/docs/docs/main/class/Client?scrollTo=e-interactionCreate)
- [interactionFailure](https://discordjs-self-v13.netlify.app/#/docs/docs/main/class/Client?scrollTo=e-interactionFailure)
- [interactionSuccess](https://discordjs-self-v13.netlify.app/#/docs/docs/main/class/Client?scrollTo=e-interactionSuccess)
- [interactionModalCreate](https://discordjs-self-v13.netlify.app/#/docs/docs/main/class/Client?scrollTo=e-interactionModalCreate)