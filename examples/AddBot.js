'use strict';

const Captcha = require('2captcha');
const Discord = require('../src/index');

const solver = new Captcha.Solver('<2captcha key>');

const client = new Discord.Client({
  captchaSolver: function (captcha, UA) {
    return solver
      .hcaptcha(captcha.captcha_sitekey, 'discord.com', {
        invisible: 1,
        userAgent: UA,
        data: captcha.captcha_rqdata,
      })
      .then(res => res.data);
  },
  TOTPKey: '<string>',
});

client.on('ready', async () => {
  console.log('Ready!', client.user.tag);
  // Note
  // You need to include `guild_id` to invite the bot
  // These two fields can appear either in the URL or in the options.
  await client.authorizeURL(
    `https://discord.com/api/oauth2/authorize?client_id=289066747443675143&permissions=414501424448&scope=bot%20applications.commands`,
    {
      guild_id: 'guild id',
    },
  );
});

client.login('token');
