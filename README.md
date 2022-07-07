<div align="center">
  <br />
  <p>
    <a href="https://discord.js.org"><img src="https://discord.js.org/static/logo.svg" width="546" alt="discord.js" /></a>
  </p>
  <br />
  <p>
    <a href="https://discord.gg/djs"><img src="https://img.shields.io/discord/222078108977594368?color=5865F2&logo=discord&logoColor=white" alt="Discord server" /></a>
    <a href="https://www.npmjs.com/package/discord.js"><img src="https://img.shields.io/npm/v/discord.js.svg" alt="npm version" /></a>
    <a href="https://www.npmjs.com/package/discord.js"><img src="https://img.shields.io/npm/dt/discord.js.svg" alt="npm downloads" /></a>
    <a href="https://github.com/discordjs/discord.js/actions"><img src="https://github.com/discordjs/discord.js/actions/workflows/test.yml/badge.svg" alt="Tests status" /></a>
  </p>
</div>

## About

<strong>Welcome to `discord.js-selfbot-v13@v2.3`, based on `discord.js@13.8.1`</strong>

- discord.js-selfbot-v13 is a [Node.js](https://nodejs.org) module that allows user accounts to interact with the Discord API v9.


<div align="center">
  <p>
    <a href="https://www.npmjs.com/package/discord.js-selfbot-v13"><img src="https://img.shields.io/npm/v/discord.js-selfbot-v13.svg" alt="npm version" /></a>
    <a href="https://www.npmjs.com/package/discord.js-selfbot-v13"><img src="https://img.shields.io/npm/dt/discord.js-selfbot-v13.svg" alt="npm downloads" /></a>
    <a href="https://github.com/aiko-chan-ai/discord.js-selfbot-v13/actions"><img src="https://github.com/aiko-chan-ai/discord.js-selfbot-v13/actions/workflows/lint.yml/badge.svg" alt="Tests status" /></a>
  </p>
</div>

### <strong>I don't take any responsibility for blocked Discord accounts that used this module.</strong>
### <strong>Using this on a user account is prohibited by the [Discord TOS](https://discord.com/terms) and can lead to the account block.</strong>

### Finally the package got 100 stars (GitHub), thank you all 💖

### <strong>[Document Website (recommend)](https://discordjs-self-v13.netlify.app/)</strong>

### <strong>[Extend Document (With Example)](https://github.com/aiko-chan-ai/discord.js-selfbot-v13/tree/main/Document)</strong>

## Checklist
- [x] Send + receive messages (not send Embed :v ).
- [x] Setting Discord App (Missing a lot of functions)
- [X] REST (Guild, Relationships, Profile Editing)
- [X] Interactions (slash commands, buttons, context menu, modal)
- [X] Voice (Call, Join, Leave, Speak, etc.)
- [X] Documentation
- [ ] Add more guild http api wraps
- [ ] Video stream
- [ ] Everything

## Installation

**Node.js 16.6.0 or newer is required**

```sh-session
npm install discord.js-selfbot-v13@latest
```
## Example

```js
const { Client } = require('discord.js-selfbot-v13');
const client = new Client(); // All partials are loaded automatically

client.on('ready', async () => {
  console.log(`${client.user.username} is ready!`);
})

client.login('token');
```

<strong>Github Repo (Play Youtube music) [Here](https://github.com/aiko-chan-ai/Selfbot-Example)</strong>

## Get Token ?

<strong>Copy code to console Discord [Ctrl + Shift + I]</strong>

```js
window.webpackChunkdiscord_app.push([
  [Math.random()],
  {},
  req => {
    for (const m of Object.keys(req.c)
      .map(x => req.c[x].exports)
      .filter(x => x)) {
      if (m.default && m.default.getToken !== undefined) {
        return copy(m.default.getToken());
      }
      if (m.getToken !== undefined) {
        return copy(m.getToken());
      }
    }
  },
]);
console.log('%cWorked!', 'font-size: 50px');
console.log(`%cYou now have your token in the clipboard!`, 'font-size: 16px');
```

Credit: <img src="https://cdn.discordapp.com/emojis/889092230063734795.png" alt="." width="16" height="16"/> [<strong>hxr404</strong>](https://github.com/hxr404/Discord-Console-hacks)


## Contributing

- Before creating an issue, please ensure that it hasn't already been reported/suggested, and double-check the
[documentation](https://discord.js.org/#/docs).  
- See [the contribution guide](https://github.com/discordjs/discord.js/blob/main/.github/CONTRIBUTING.md) if you'd like to submit a PR.

## Need help?
Contact me in Discord: [Shiraori#1782](https://discord.com/users/721746046543331449)

## Credits
- [Discord.js](https://github.com/discordjs/discord.js)
- [Discord S.C.U.M](https://github.com/Merubokkusu/Discord-S.C.U.M)
- [Discord Console Hack](https://github.com/hxr404/Discord-Console-hacks)

## <strong><img src="https://cdn.discordapp.com/attachments/820557032016969751/952436539118456882/flag-vietnam_1f1fb-1f1f3.png" alt="." width="20" height="20"/> Vietnamese</strong>
Được tạo bởi người Việt Nam, dựa trên Discord API v9, đây là một trong những module selfbot được hỗ trợ tốt nhất.

# From Github with love 💕