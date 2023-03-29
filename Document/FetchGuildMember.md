### Credit: Discord-S.C.U.M
- Link: [Here](https://github.com/Merubokkusu/Discord-S.C.U.M/blob/master/docs/using/fetchingGuildMembers.md#Algorithm)

# Fetching Guild Members

### <strong>Assume you don't have one of the following permissions</strong>
> `ADMINISTRATOR`, `KICK_MEMBERS`, `BAN_MEMBERS`, `MANAGE_ROLES`

Alright so this really needs a page of its own because it's special. There's no actual api endpoint to get the guild members, so instead you have 2 options:    
1)  fetch the member list sidebar (guild.members.fetchMemberList, which uses opcode 14)
    - when to use: if you can see any categories/channels in the guild
    - pro: fast
    - con: for large servers (```guild.memberCount > 1000```), only not-offline members are fetched
     
2)  search for members by query (guild.members.fetchBruteforce, which uses opcode 8)      
    - when to use: if you cannot see any categories/channels in the guild
    - pro: can potentially get the entire member list, can scrape members from multiple guilds at the same time
    - con: slow af (speed is dependent on brute forcer optimizations)

____________________________________
# Links/Table of Contents
- [fetch the member list sidebar (faster, but less members)](#fetch-the-member-list-sidebar)
  - [Algorithm](#Algorithm)
  - [How many members can I fetch?](#how-many-members-can-i-fetch)
  - [Examples](#Examples)
  - [Efficiency & Effectiveness](#efficiency--effectiveness)
  - [POC: fetching the memberlist backwards](#fetching-the-member-list-backwards)
- [search for members by query (slower, but more members)](#search-for-members-by-query)
  - [Usage](#Usage)
  - [Algorithm](#Algorithm-1)
  - [How many members can I fetch?](#how-many-members-can-i-fetch-1)
___________________________________
## Fetch the Member List Sidebar
#### Algorithm
1) load guild data (send an op14 with range [0,99]). If the guild is unavailable, discord will send over a GUILD_CREATE event.
2) subscribe to a list of ranges in member list sidebar.
3) after a GUILD_MEMBER_LIST_UPDATE is received, update the saved member list data and subscribe to a new list of ranges

note: 
- you don't have to wait for a GUILD_MEMBER_LIST_UPDATE event to send the next list of member ranges
- there're 2 methods to fetch the member list: 
    - overlap. Ranges subscribed to (in order) are:
      ```
      [[0,99], [100,199]]
      [[0,99], [100,199], [200,299]]
      [[0,99], [200,299], [300,399]]
      ...
      ```
    - nonoverlap. Ranges subscribed to (in order) are:
      ```
      [[0,99], [100,199]]
      [[0,99], [200,299], [300,399]]
      [[0,99], [400,499], [500,599]]
      ...
      ```
- more info: https://arandomnewaccount.gitlab.io/discord-unofficial-docs/lazy_guilds.html

#### How many members can I fetch?
Even though it's not yet known how discord calculates this, you can still come up with a "ground truth" number. The steps are as follows:
1) open your browser's dev tools (chrome dev tools is a favorite)
2) click on the network tab and make sure you can see websocket connections
3) go to a guild and scroll all the way down on the member list
4) see what are the ranges of the last gateway request your client sends (the # of fetchable members is somewhere in these ranges)

#### Examples
all examples shown use the "overlap" method

```js
const guild = client.guilds.cache.get('id');
const channel = guild.channels.cache.get('id');
// Overlap (slow)
for (let index = 0; index <= guild.memberCount; index += 100) {
  await guild.members.fetchMemberList(channel, index, index !== 100).catch(() => {});
  await client.sleep(500);
}
// Non-overlap (fast)
for (let index = 0; index <= guild.memberCount; index += 200) {
  await guild.members.fetchMemberList(channel, index == 0 ? 100 : index, index !== 100).catch(() => {});
  await client.sleep(500);
}
console.log(guild.members.cache.size); // will print the number of members in the guild
```

It's possible that fetchMembers doesn't fetch all not-offline members due to rate limiting. Don't worry if this happens, you can start fetching members from any index.
```js
const guild = client.guilds.cache.get('id');
const channel = guild.channels.cache.get('id');
// Fetch member range 5000-5099
await guild.members.fetchMemberList(channel, 5000);
```

#### Efficiency & Effectiveness

|      | overlap&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | no overlap |
|------|---------|------------|
| 2.1k |![a](https://github.com/Merubokkusu/Discord-S.C.U.M/raw/master/docs/using/memberFetchingStats/2100a.jpg)    |![c](https://github.com/Merubokkusu/Discord-S.C.U.M/raw/master/docs/using/memberFetchingStats/2100b.jpg)       |
| 128k |![b](https://github.com/Merubokkusu/Discord-S.C.U.M/raw/master/docs/using/memberFetchingStats/128ka.jpg)    |![d](https://github.com/Merubokkusu/Discord-S.C.U.M/raw/master/docs/using/memberFetchingStats/128kb.jpg)       |

As you can see, the "no overlap" method fetches 200 members/second while the "overlap" method fetches 100 members/second. However, "no overlap" is also a lot less effective. After doing a few more tests with both methods ("overlap" and "no overlap"), "no overlap" shows a lot less consistency/reliability than "overlap".


#### Fetching the member list backwards
(and in pretty much any "style" you want)       
So, this is more proof-of-concept, but here's a short explanation.         
Suppose you're in a guild with 1000 members and want to fetch the member list backwards (I dunno...more undetectable since noone fetches it backwards? lol).        
   Since discum requests members in 200-member chunks, you'll either have to request for the following range groups (safer):        
   ```
   [[0,99],[800,899],[900,999]] #target start: 800
   [[0,99],[700,799],[800,899]] #target start: 700
   [[0,99],[600,699],[700,799]] #target start: 600
   [[0,99],[500,599],[600,699]] #target start: 500
   [[0,99],[400,499],[500,599]] #target start: 400
   [[0,99],[300,399],[400,499]] #target start: 300
   [[0,99],[200,299],[300,399]] #target start: 200
   [[0,99],[100,199],[200,299]] #target start: 100
   [[0,99],[100,199]] #target start: 0
   ```
   or the following range groups (faster):        
   ```
   [[0,99],[800,899],[900,999]] #target start: 800
   [[0,99],[600,699],[700,799]] #target start: 600
   [[0,99],[400,499],[500,599]] #target start: 400
   [[0,99],[200,299],[300,399]] #target start: 200
   [[0,99],[100,199]] #target start: 0
   ```
   The first one looks like an overlap method while the second looks like a no-overlap method. However, since we're fetching the memberlist backwards, we cannot   
   use 100 and 200 for the methods. Instead, we need a list of multipliers (method) and a startIndex.         
____________________________________
## Search for Members by Query
#### Usage
1) run the function:
  ```js
  guild.members.fetchBruteforce({
    delay: 500,
    depth: 1, // ['a', 'b', 'c', 'd', ...] or ['aa', 'ab', 'ac', 'ad', ...] if depth is 2, ...
  })
  ```
  A wait time of at least 0.5 is needed to prevent the brute forcer from rate limiting too often. In the event that the brute forcer does get rate limited, some time will be lost reconnecting.
#### Algorithm
for simplicity, assume that the list of characters to search for is ['a', 'b', 'c', 'd']
1) query for up to 100 members in guild who have a nickname/username starting with 'a'
2) on a GUILD_MEMBERS_CHUNK event:
    - if there are 100 results:
        - add on the 2nd character of the last result. For example, if the results are
            ```
            aaaaaaaaaaaa
            aaadfd3fgdftjh
            ...
            Acaddd
            ``` 
            , 
            the next query will be 'ac'. Note: searches are case-insensitive and consecutive spaces are treated like single spaces.
    - if there are less than 100 results:
        - replace the last index of the query with the next option in the list

This algorithm can definitely be made a lot better so have at it. The brute forcer example is just there to help you get started.

#### How many members can I fetch?
- a limit is posed if many users have the same nickname & username (but different discriminators). Only the 1st 100 members will be able to be fetched. There's no known way to include the discriminator # in the search.
- also, in order to query users with fancy characters in their username/nickname, the op8 brute forcer needs to be slowed down (cause, more characters to search)

#### Testing !!!

- Example
```js
const Discord = require('discord.js-selfbot-v13');
const client = new Discord.Client();
client.on('debug', console.log)
client.on('ready', () => {
	console.log('Logged in as', client.user.tag);
	const guild = client.guilds.cache.get('662267976984297473'); // Midjourney - 13M members
	guild.members.fetchBruteforce({
		depth: 2, // 2 levels of recursion
		delay: 500, // 500ms delay between each request
	});
	setInterval(() => {
		console.log('Fetching members...', guild.members.cache.size);
	}, 1000);
});
client.login('token');
```

- 2000 years later...

<img src='https://cdn.discordapp.com/attachments/820557032016969751/1090606227265966140/image.png'>

`138k/13.8M (1%)` members fetched in `~30 mins` (with a delay of 500ms) :skull: