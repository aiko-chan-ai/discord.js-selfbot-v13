# Quick Links
- [Client Settings](https://github.com/aiko-chan-ai/discord.js-selfbot-v13/blob/main/Document/ClientOption.md#client-settings)
- [Client Functions](https://github.com/aiko-chan-ai/discord.js-selfbot-v13/blob/main/Document/ClientOption.md#client-functions)
- [Custom Status](https://github.com/aiko-chan-ai/discord.js-selfbot-v13/blob/main/Document/ClientOption.md#sync-status)

## Client Settings
```js
new Client({
  checkUpdate: true, // Check Package Update (Bot Ready) [Enable Default]
  readyStatus: false, // Set Custom Status sync from Account (Bot Ready) [Disable Default]
  autoCookie: true, //  Auto added Cookie and Fingerprint [Enable Default](https://github.com/aiko-chan-ai/discord.js-selfbot-v13/blob/main/DOCUMENT.md#http-options)
})
```

## Client Functions
- Update Cookie and Fingerprint
```js
client.updateCookie(): Promise<void>
```
- Redeem Nitro
```js
client.redeemNitro('code'): Promise<void>
```

## Sync Status
```js
client.customStatusAuto(): Promise<void>
```