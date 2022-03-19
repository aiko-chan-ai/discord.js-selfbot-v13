<div align="center">
  <br />
  <p>
    <a href="https://discord.js.org"><img src="https://discord.js.org/static/logo.svg" width="546" alt="discord.js" /></a>
  </p>
  <br />
  <p>
    <a href="https://discord.gg/3makcFd2m4"><img src="https://img.shields.io/discord/936023564254056479?color=5865F2&logo=discord&logoColor=white" alt="Discord server" /></a>
    <a href="https://www.npmjs.com/package/dsb.js"><img src="https://img.shields.io/npm/v/dsb.js?style=flat-square" alt="npm version" /></a>
    <a href="https://www.npmjs.com/package/dsb.js"><img src="https://img.shields.io/npm/dt/dsb.js?style=flat-square" alt="npm downloads" /></a>
  </p>
</div>

## About

dsb is a [Node.js](https://nodejs.org) module that allows user accounts to interact with the discord api

<strong>I am in no way responsible for what happens to your account. What you do is on you!</strong>

## Installation

**Node.js 16.9.0 or newer is required**

```sh-session
npm install dsb.js
```

## Example

```js
const { Client } = require('dsb.js');
const client = new Client(); // intents and partials are already set so you don't have to define them

client.on('ready', async () => {
  console.log(`${client.user.username}  >>  [${client.guilds.cache.size}] guilds || [${client.friends.cache.size}] friends`);
})

client.login('token');
```

## Links
- [Documentation](https://discord.js.org/#/docs/discord.js/stable/general/welcome)
- [GitHub](https://github.com/TheDevYellowy/discordjs-selfbot)
- [Discord](https://discord.gg/3makcFd2m4)
