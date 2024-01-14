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
});

client.on('ready', async () => {
  console.log('Ready!', client.user.tag);
  await client.authorizeURL(
    `https://discord.com/api/oauth2/authorize?client_id=289066747443675143&permissions=414501424448&scope=bot%20applications.commands`,
    {
      guild_id: 'guild id',
      permissions: '8', // Admin
      authorize: true,
    },
  );
});

client.login('token');
