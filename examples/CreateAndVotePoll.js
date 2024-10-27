const { Client } = require('../src/index');
const client = new Client();

client.on('ready', async () => {
  console.log(`${client.user.username} is ready!`);
  const channel = client.channels.cache.get('channel id');
  const message = await channel.send({
    poll: {
      question: {
        text: 'What is your favorite color?',
      },
      answers: [{ text: 'Red', emoji: '🍎' }, { text: 'Green', emoji: '🥗' }, { text: 'Blue', emoji: '💙' }, { text: 'Yellow', emoji: '🟡' }],
      duration: 8,
      allowMultiselect: true,
    },
  });

  console.log(message.poll);
  // Multi select
  await message.vote(1, 3);
});

client.on('messagePollVoteAdd', (answer, userId) => {
  console.log(`User ${userId} voted for answer ${answer.id}`);
});

client.on('messagePollVoteRemove', (answer, userId) => {
  console.log(`User ${userId} removed their vote for answer ${answer.id}`);
});

client.on('messageUpdate', async (_oldMessage, newMessage) => {
  if (!newMessage.poll) return;

  console.log('Poll was updated', newMessage.poll);
});

client.login('token');
