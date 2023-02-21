<img src='https://cdn.discordapp.com/attachments/820557032016969751/1077527909302018088/image.png'>

```js
const { Client } = require('discord.js-selfbot-v13');

const client = new Client();

client.on('ready', async () => {
    client.user.setSamsungActivity('com.YostarJP.BlueArchive', 'START');
    // client.user.setSamsungActivity('com.miHoYo.bh3oversea', 'UPDATE');
    // client.user.setSamsungActivity('com.miHoYo.GenshinImpact', 'STOP');
});

client.login('token');
```

