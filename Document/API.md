# Extending Discord.js-selfbot-v13
> `credit: Discum`

How to add extra API wraps to Discord.js-selfbot-v13?
# Table of Contents
- [HTTP APIs](#HTTP-APIs) 
- [Gateway APIs](#Gateway-APIs)

### HTTP APIs:

```js
URL example:
'https://discord.com/api/v9/users/@me'
const url = client.api.users['@me'];
/* Method: GET | POST | PUT | PATCH | DELETE */
Option: 
#1
query: Object

- example: https://discord.com/api/v9/users/@me?abc=123&xyz=ok (GET)

client.api.users['@me'].get({ 
  query: {
    abc: 123,
    xyz: 'ok',
  }
});

#2

body + files: Object + Array
-> 'content-type': FormData (POST)

#3

data: Object
-> 'content-type': 'application/json'

...

```


###### GET: 
```js
await client.api.users['@me'].get({ versioned: true });
/* Request: https://discord.com/api/v9/users/@me */
await client.api.users['@me'].get({ versioned: false });
/* Request: https://discord.com/api/users/@me */
```
###### POST: 
```js
await client.api.channels[channel.id].messages.post({ versioned: true, data: {}, files: [] });
/* Request: https://discord.com/api/v9/channels/{channel.id}/messages */
```
###### PUT: 
```js
await client.api
      .guilds(guild.id)
      .bans(user.id)
      .put({
        versioned: true,
        data: {},
      });
/* Request: https://discord.com/api/guilds/{guild.id}/bans/{user.id} */
```
###### PATCH: 
```js
await client.api.users['@me'].patch({ versioned: true, data: {} });
/* Request: https://discord.com/api/v9/users/@me */
```
###### DELETE: 
```js
await client.api.hypesquad.online.delete({ versioned: true });
/* Request: https://discord.com/api/v9/hypesquad/online */
```    
### Gateway APIs
You need to send data to the port and listen for an event. This is quite complicated but if you want to use an existing event, here are the instructions

###### SEND:
```js
const { Constants } = require('discord.js-selfbot-v13');
// Global gateway (example update presence)
client.ws.broadcast({
    op: Constants.Opcodes.STATUS_UPDATE,
    d: {},
});
// Guild gateway (example get all members)
guild.shard.send({
    op: Constants.Opcodes.REQUEST_GUILD_MEMBERS,
    d: {},
});
```