## HTTP options:
- Change API v9 to v10
```js
/* If you want to change the API version from v9 to v10, here are the instructions */
const { Client } = require('discord.js-selfbot-v13');
const client = new Client({
	ws: {
		version: 10
	},
	http: {
		version: 10,
		header: {
			cookie: '', // If you want to use cookies, here is the place
		}
	}
});
```