## Discord's local RPC servers (~ discord app)

```js
const { Client, RichPresence, DiscordRPCServer } = require('discord.js-selfbot-v13');

const client = new Client();

client.once('ready', async () => {
    const server = await new DiscordRPCServer(client, false)
    server.on('activity', async data => {
        if (!data.activity) return;
        const activity = new RichPresence(client, data.activity);
        client.user.setActivity(activity);
    });
});

client.login('token');
```