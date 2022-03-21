# Discord.js Selfbot v13
- Install: <strong>npm i discord.js-selfbot-v13@lasest</strong>
## User Settings
<details>
<summary><strong>Click to show</strong></summary>

```js
client.setting // Return Data Setting User;
client.setting.setDisplayCompactMode(true | false); // Message Compact Mode
client.setting.setTheme('dark' | 'light'); // Discord App theme
client.setting.setLocale(value); // Set Language
	/**
	 * * Locale Setting, must be one of:
	 * * `DANISH`
	 * * `GERMAN`
	 * * `ENGLISH_UK`
	 * * `ENGLISH_US`
	 * * `SPANISH`
	 * * `FRENCH`
	 * * `CROATIAN`
	 * * `ITALIAN`
	 * * `LITHUANIAN`
	 * * `HUNGARIAN`
	 * * `DUTCH`
	 * * `NORWEGIAN`
	 * * `POLISH`
	 * * `BRAZILIAN_PORTUGUESE`
	 * * `ROMANIA_ROMANIAN`
	 * * `FINNISH`
	 * * `SWEDISH`
	 * * `VIETNAMESE`
	 * * `TURKISH`
	 * * `CZECH`
	 * * `GREEK`
	 * * `BULGARIAN`
	 * * `RUSSIAN`
	 * * `UKRAINIAN`
	 * * `HINDI`
	 * * `THAI`
	 * * `CHINA_CHINESE`
	 * * `JAPANESE`
	 * * `TAIWAN_CHINESE`
	 * * `KOREAN`
	 * @param {string} value
	 * @returns {locale}
	 */
```

</details>

## Discord User Info
<details>
<summary><strong>Click to show</strong></summary>

Code:
```js
GuildMember.user.getProfile();
// or
User.getProfile();
```
Response
```js
User {
  id: '721746046543331449',
  bot: false,
  system: false,
  flags: UserFlagsBitField { bitfield: 256 },
  friend: false,
  blocked: false,
  connectedAccounds: [],
  premiumSince: 1623357181151,
  premiumGuildSince: 0,
  mutualGuilds: Collection(3) [Map] {
    '906765260017516605' => { id: '906765260017516605', nick: null },
    '809133733591384155' => { id: '809133733591384155', nick: 'uwu' },
    '926065180788531261' => { id: '926065180788531261', nick: 'shiro' }
  },
  username: 'Shiraori',
  discriminator: '1782',
  avatar: 'f9ba7fb35b223e5f1a12eb910faa40c2',
  banner: undefined,
  accentColor: undefined
}
```
</details>

## Discord User Friend / Blocked
<details>
<summary><strong>Click to show</strong></summary>

Code:
```js
GuildMember.user.setFriend();
User.unFriend();
Message.member.user.sendFriendRequest();
// or
GuildMember.user.setBlock();
User.unBlock();
```
Response
```js
User {
  id: '721746046543331449',
  bot: false,
  system: false,
  flags: UserFlagsBitField { bitfield: 256 },
  friend: false,
  blocked: false,
  connectedAccounds: [],
  premiumSince: 1623357181151,
  premiumGuildSince: 0,
  mutualGuilds: Collection(3) [Map] {
    '906765260017516605' => { id: '906765260017516605', nick: null },
    '809133733591384155' => { id: '809133733591384155', nick: 'uwu' },
    '926065180788531261' => { id: '926065180788531261', nick: 'shiro' }
  },
  username: 'Shiraori',
  discriminator: '1782',
  avatar: 'f9ba7fb35b223e5f1a12eb910faa40c2',
  banner: undefined,
  accentColor: undefined
}
```
</details>

## Discord Guild set position
<details>
<summary><strong>Click to show</strong></summary>

Code:
```js
guild.setPosition(position, type, folderID);
// Position: The guild's index in the directory or out of the directory
// Type:
//     + 'FOLDER': Move guild to folder
//     + 'HOME': Move the guild out of the directory
// FolderID: The folder's ID , if you want to move the guild to a folder
```
Response
```js
Guild
```
</details>

## Custom Status and RPC

<details>
<summary><strong>Click to show</strong></summary>
Custom Status

```js
const RichPresence = require('discord-rpc-contructor'); // My module :))
const custom = new RichPresence.CustomStatus()
	.setUnicodeEmoji('🎮') // Set Unicode Emoji [Using one]
    .setDiscordEmoji({ // Set Custom Emoji (Nitro) [Using one]
        name: 'nom',
        id: '737373737373737373',
        animated: false,
    })
	.setState('Testing') // Name of presence
    .toDiscord();
client.user.setActivity(custom);
```

Rich Presence
```js
Come back soon !
```
</details>

## More features

<details>
<summary><strong>Click to show</strong></summary>
- I need requests from you! Ask questions, I will help you!
</details>