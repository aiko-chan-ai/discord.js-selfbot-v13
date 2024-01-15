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
  captchaRetryLimit: 3,
});

client.on('ready', async () => {
  console.log('Ready!', client.user.tag);
  await client.acceptInvite('mdmc');
});

client.login('token');
