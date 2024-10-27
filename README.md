<div align="center">
  <br />
  <p>
    <a href="https://discord.js.org"><img src="https://discord.js.org/static/logo.svg" width="546" alt="discord.js" /></a>
  </p>
</div>

> [!TIP]
> **Check out this poll: https://github.com/aiko-chan-ai/discord.js-selfbot-v13/discussions/1292**

## About

<strong>Welcome to `discord.js-selfbot-v13@v3.4`, based on `discord.js@13.17` and backport `discord.js@14.16.3`</strong>

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

## Project Status

`discord.js-selfbot-v13` is currently in maintenance mode. New features are not actively being added but existing features and new versions of discord are supported as possible. There are some major architectural changes which need to be added to improve the stability and security of the project. I don't have as much spare time as I did when I started this project, so there is not currently any plan for these improvements.

### <strong>[Document Website](https://discordjs-self-v13.netlify.app/)</strong>

### <strong>[Example Code](https://github.com/aiko-chan-ai/discord.js-selfbot-v13/tree/main/examples)</strong>

## Features (User)
- [x] Message: Embeds (WebEmbed)
- [x] User: Status, Activity, RemoteAuth, etc.
- [X] Guild: Fetch Members, Join / Leave, Top emojis, ...
- [X] Interactions: Slash Commands, Buttons, Menu, Modal
- [X] Captcha Handler (2captcha, capmonster, custom)
- [X] Documentation
- [x] Voice & Video stream
- [ ] Everything

## Installation

**Node.js 16.6.0 or newer is required**

> Recommended Node.js version: 18+ (LTS)

```sh-session
npm install discord.js-selfbot-v13@latest
```

## Example

```js
const { Client } = require('discord.js-selfbot-v13');
const client = new Client();

client.on('ready', async () => {
  console.log(`${client.user.username} is ready!`);
})

client.login('token');
```

## Get Token ?

<strong>Run code (Discord Console - [Ctrl + Shift + I])</strong>

```js
window.webpackChunkdiscord_app.push([
  [Math.random()],
  {},
  req => {
    if (!req.c) return;
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

## Contributing

- Before creating an issue, please ensure that it hasn't already been reported/suggested, and double-check the
[documentation](https://discordjs-self-v13.netlify.app/).  
- See [the contribution guide](https://github.com/discordjs/discord.js/blob/main/.github/CONTRIBUTING.md) if you'd like to submit a PR.

## Need help?
Github Discussion: [Here](https://github.com/aiko-chan-ai/discord.js-selfbot-v13/discussions)

## Credits
- [Discord.js](https://github.com/discordjs/discord.js)

## <strong>Other project(s)

- 📘 [***aiko-chan-ai/DiscordBotClient***](https://github.com/aiko-chan-ai/DiscordBotClient) <br/>
  A patched version of discord, with bot login support

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=aiko-chan-ai/discord.js-selfbot-v13&type=Date)](https://star-history.com/#aiko-chan-ai/discord.js-selfbot-v13&Date)


# From Github with love 💕
