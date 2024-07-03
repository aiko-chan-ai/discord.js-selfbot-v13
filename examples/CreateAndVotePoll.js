const { Client, MessagePoll } = require('../src/index');
const client = new Client();

client.on('ready', async () => {
  console.log(`${client.user.username} is ready!`);
  const channel = client.channels.cache.get('channel id');
  const poll = new MessagePoll();
  poll
    .setQuestion('Test question')
    .setAnswers([
      {
        text: 'answer 1',
        emoji: {
          name: '🎈',
        },
      },
      {
        text: 'answer 2',
        emoji: {
          name: '🎃',
        },
      },
      {
        text: 'answer 3',
      },
    ])
    .setAllowMultiSelect(true)
    .setDuration(4); // 4h
  const msg = await channel.send({
    poll,
  });
  // Multi select
  await msg.vote(1,3);
  // End poll
  await msg.endPoll();
});

client.login('token');
