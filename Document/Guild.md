# Quick Links:
- [Set Guild Folder and Position](https://github.com/aiko-chan-ai/discord.js-selfbot-v13/blob/main/Document/Guild.md#discord-guild-set-position)
- [DM group](https://github.com/aiko-chan-ai/discord.js-selfbot-v13/blob/main/Document/Guild.md#group-dm)
- [Join Guild](https://github.com/aiko-chan-ai/discord.js-selfbot-v13/blob/main/Document/Guild.md#join-guild-using-invite)
- [Community](https://github.com/aiko-chan-ai/discord.js-selfbot-v13/blob/main/Document/Guild.md#set-community)

## Discord Guild set position
<details open>
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
Guild {}
```
</details>

## Group DM
<details open>
<summary><strong>Click to show</strong></summary>

Code:
```js
/* Create */
const memberAdd = [
	client.users.cache.get('id1'),
	client.users.cache.get('id2'),
	...
	client.users.cache.get('id9')
]
// Max member add to Group: 9, Min: 2
await client.channels.createGroupDM(memberAdd);
/* Edit */
const groupDM = client.channels.cache.get('id');
await groupDM.setName('New Name');
await groupDM.setIcon('iconURL');
await groupDM.getInvite();
await groupDM.fetchInvite();
await groupDM.removeInvite(invite);
await groupDM.addMember(user);
await groupDM.removeMember(user);
/* Text Channel not Bulk delete */
await groupDM.send('Hello World');
await groupDM.delete(); // Leave
/* Voice Channel */
await groupDM.call()
```
	
</details>


## Join Guild using Invite
<details open>
<summary><strong>Click to show</strong></summary>

```js
await client.fetchInvite('code').then(async invite => {
  await invite.acceptInvite(true); 
});
```
`invite.acceptInvite(true);` => Auto skip verify screen

<img src= 'https://cdn.discordapp.com/attachments/820557032016969751/957247688666132520/unknown.png'>

<strong>But if you are blocked by HCaptcha, this will not work</strong>
</details>

## Set Community
<details open>
<summary><strong>Click to show</strong></summary>

```js
await guild.setCommunity(stats: boolean, publicUpdatesChannel: TextChannelResolvable, rulesChannel: TextChannelResolvable, reason?: string): Promise<Guild>;
// Enable with default
await guild.setCommunity(true);
// Disable
await guild.setCommunity(false);
```
</details>
