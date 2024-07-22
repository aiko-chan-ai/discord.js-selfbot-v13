'use strict';

const Discord = require('../src/index');
const { ProxyAgent } = require('proxy-agent');

const proxy = new ProxyAgent({
  getProxyForUrl: function () {
    return '<any proxy>';
  },
});

const client = new Discord.Client({
  ws: {
    agent: proxy, // WebSocket Proxy
  },
  http: {
    agent: proxy, // REST Proxy
  },
});

client.on('ready', async () => {
  console.log('Ready!', client.user.tag);
});

client.login('token');
