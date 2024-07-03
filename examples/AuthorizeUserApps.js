'use strict';

const Discord = require('../src/index');

const client = new Discord.Client();

client.on('ready', async () => {
  console.log('Ready!', client.user.tag);
  await client.installUserApps('936929561302675456'); // Midjourney
});

client.login('token');
