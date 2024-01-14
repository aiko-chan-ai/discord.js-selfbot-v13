const { Client } = require('../src/index');

const client = new Client();

client.on('ready', async () => {
  client.user.setSamsungActivity('com.YostarJP.BlueArchive', 'START');

  setTimeout(() => {
    client.user.setSamsungActivity('com.miHoYo.bh3oversea', 'UPDATE');
  }, 30_000);

  setTimeout(() => {
    client.user.setSamsungActivity('com.miHoYo.GenshinImpact', 'STOP');
  }, 60_000);
});

client.login('token');
