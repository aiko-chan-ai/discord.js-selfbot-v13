# Quick Links:
- [Setting](https://github.com/aiko-chan-ai/discord.js-selfbot-v13/blob/main/Document/User.md#user-settings)
- [User Info](https://github.com/aiko-chan-ai/discord.js-selfbot-v13/blob/main/Document/User.md#discord-user-info)
- [Relationship](https://github.com/aiko-chan-ai/discord.js-selfbot-v13/blob/main/Document/User.md#discord-user-friend--blocked)
- [Other](https://github.com/aiko-chan-ai/discord.js-selfbot-v13/blob/main/Document/User.md#user--clientuser-method)

## User Settings
<details open>
<summary><strong>Click to show</strong></summary>

```js
client.setting // Return Data Setting User;
client.settings.setDisplayCompactMode(true | false); // Message Compact Mode
client.settings.setTheme('dark' | 'light'); // Discord App theme
client.settings.setLocale(value); // Set Language
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
	 */
// Setting Status
client.settings.setCustomStatus({
  status: 'online', // 'online' | 'idle' | 'dnd' | 'invisible' | null
  text: 'Hello world', // String | null
  emoji: '🎮', // UnicodeEmoji | DiscordEmoji | null
  expires: null, // Date.now() + 1 * 3600 * 1000 <= 1h to ms
});
// => Clear
client.settings.setCustomStatus();
```

</details>

## Discord User Info
<details open>
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
  connectedAccounts: [],
  premiumSince: 1623357181151,
  premiumGuildSince: 0,
  bio: null,
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
<details open>
<summary><strong>Click to show</strong></summary>

Code:
```js
// You can use client.relationships to manage your friends and blocked users.
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
  note: null,
  connectedAccounts: [],
  premiumSince: 1623357181151,
  premiumGuildSince: 0,
  bio: null,
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

## User & ClientUser Method
<details open>
<summary><strong>Click to show</strong></summary>

```js
// HypeSquad
await client.user.setHypeSquad('HOUSE_BRAVERY');
await client.user.setHypeSquad('HOUSE_BRILLIANCE');
await client.user.setHypeSquad('HOUSE_BALANCE');
await client.user.setHypeSquad('LEAVE');
// Set Note to User
await user.setNote('Hello World');
// Set Username
await client.user.setUsername('new username', 'password');
// Set Accent Color
await client.user.setAccentColor('RED'); // set color same as Embed.setColor()
// Set Banner
await client.user.setBanner('image file / image url'); // same as setAvatar & Require Nitro level 2
// Set Discord Tag
await client.user.setDiscriminator('1234', 'password'); // #1234 & Require Nitro
// Set About me
await client.user.setAboutMe('Hello World');
// Set Email
await client.user.setEmail('aiko.dev@mail.nezukobot.vn', 'password'); // It is clone email =))
// Change Password
await client.user.setPassword('old password', 'new password');
// Disable Account
await client.user.disableAccount('password');
// Delete Account [WARNING] Cannot be changed once used!
await client.user.deleteAccount('password');
// Redeem Nitro
await client.redeemNitro('code')
```
</details>
