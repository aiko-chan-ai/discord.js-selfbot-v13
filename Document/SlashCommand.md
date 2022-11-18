# Slash command

# Slash Command (no options)

### Demo

![image](https://user-images.githubusercontent.com/71698422/173344527-86520c60-64cd-459c-ba3b-d35f14279f93.png)

### Code

```js
await message.channel.sendSlash('botid', 'aiko')
```

# Slash Command + Sub option (group)

### Demo

![image](https://user-images.githubusercontent.com/71698422/173346438-678009a1-870c-49a2-97fe-8ceed4f1ab64.png)

### Code test

```js
await message.channel.sendSlash('450323683840491530', 'animal chat', 'bye')
```

# Slash Command with Attachment

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

# Events

- [interactionCreate](https://discordjs-self-v13.netlify.app/#/docs/docs/main/class/Client?scrollTo=e-interactionCreate)
- [interactionFailure](https://discordjs-self-v13.netlify.app/#/docs/docs/main/class/Client?scrollTo=e-interactionFailure)
- [interactionSuccess](https://discordjs-self-v13.netlify.app/#/docs/docs/main/class/Client?scrollTo=e-interactionSuccess)
- [interactionModalCreate](https://discordjs-self-v13.netlify.app/#/docs/docs/main/class/Client?scrollTo=e-interactionModalCreate)
