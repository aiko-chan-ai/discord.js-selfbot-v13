<div align="center">
  <br />
  <p>
    <a href="https://discord.js.org"><img src="https://discord.js.org/static/logo.svg" width="546" alt="discord.js" /></a>
  </p>
  <br />
  <p>
    <a href="https://discord.gg/djs"><img src="https://img.shields.io/discord/222078108977594368?color=5865F2&logo=discord&logoColor=white" alt="Discord server" /></a>
    <a href="https://www.npmjs.com/package/discord.js"><img src="https://img.shields.io/npm/v/discord.js.svg?maxAge=3600" alt="npm version" /></a>
    <a href="https://www.npmjs.com/package/discord.js"><img src="https://img.shields.io/npm/dt/discord.js.svg?maxAge=3600" alt="npm downloads" /></a>
    <a href="https://github.com/discordjs/discord.js/actions"><img src="https://github.com/discordjs/discord.js/actions/workflows/test.yml/badge.svg" alt="Tests status" /></a>
  </p>
</div>

## About

- discord.js-selfbot-v13 is a [Node.js](https://nodejs.org) module that allows user accounts (and bot .-.) to interact with the Discord API v9.
- Fork from [this](https://github.com/TheDevYellowy/dsb.js) module.

### <strong>I don't take any responsibility for blocked Discord accounts that used this module.</strong>
### <strong>Using this on a user account is prohibited by the [Discord TOS](https://discord.com/terms) and can lead to the account block.</strong>

## Installation

**Node.js 16.9.0 or newer is required**

```sh-session
npm install discord.js-selfbot-v13
```
## Patched
Click [here](https://github.com/aiko-chan-ai/discord.js-selfbot-v13/blob/main/DOCUMENT.md) to see the patched functions
## Example

```js
const { Client } = require('discord.js-selfbot-v13');
const client = new Client(); // Intents and Partials are already set so you don't have to define them

client.on('ready', async () => {
  console.log(`${client.user.username}  >>  [${client.guilds.cache.size}] guilds || [${client.friends.cache.size}] friends`);
})

client.login('token');
```

## Selfbot feature ?
- Friends and Block Members
- Discord Apps Setting [Theme, Language, ...]
- Get Profile GuildMember [Nitro Time, Boost Time, Connected Account, Bio, ...]
- Setting Position Guild and Folder
- You can request more features for my module by placing an issue!

## Links [Discord.js]

- [Website](https://discord.js.org/) ([source](https://github.com/discordjs/website))
- [Documentation](https://discord.js.org/#/docs)
- [Guide](https://discordjs.guide/) ([source](https://github.com/discordjs/guide))
  See also the [Update Guide](https://discordjs.guide/additional-info/changes-in-v13.html), including updated and removed items in the library.
- [discord.js Discord server](https://discord.gg/djs)
- [Discord API Discord server](https://discord.gg/discord-api)
- [GitHub](https://github.com/discordjs/discord.js)
- [npm](https://www.npmjs.com/package/discord.js)
- [Related libraries](https://discord.com/developers/docs/topics/community-resources#libraries)

## Contributing

- Before creating an issue, please ensure that it hasn't already been reported/suggested, and double-check the
[documentation](https://discord.js.org/#/docs).  
- See [the contribution guide](https://github.com/discordjs/discord.js/blob/main/.github/CONTRIBUTING.md) if you'd like to submit a PR.
- <strong>Thanks to <img src="https://avatars.githubusercontent.com/u/64450187" alt="." width="16" height="16"/> [TheDevYellowy](https://github.com/TheDevYellowy/) for patching this module!</strong>

## Need help?
Contact me in Discord [Shiraori#1782] (UserID: 721746046543331449)

## <strong><img src="https://cdn.discordapp.com/attachments/820557032016969751/952436539118456882/flag-vietnam_1f1fb-1f1f3.png" alt="." width="20" height="20"/> Vietnamese</strong>
- Tóm lại là module này dùng Discord.js v13, API v9 nên chưa chết sớm đâu, cứ dùng đi =))