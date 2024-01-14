const { Client, WebEmbed } = require('../src/index');
const client = new Client();

client.on('ready', async () => {
  console.log(`${client.user.username} is ready!`);
});

client.on('messageCreate', message => {
  if (message.content == 'embed_hidden_url') {
    const embed = new WebEmbed()
      .setAuthor({ name: 'hello', url: 'https://google.com' })
      .setColor('RED')
      .setDescription('description uh')
      .setProvider({ name: 'provider', url: 'https://google.com' })
      .setTitle('This is Title')
      .setURL('https://google.com')
      .setImage('https://i.ytimg.com/vi/iBP8HambzpY/maxresdefault.jpg')
      .setRedirect('https://www.youtube.com/watch?v=iBP8HambzpY')
      .setVideo('http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
    message.channel.send({
      content: `Hello world ${WebEmbed.hiddenEmbed}${embed}`,
    });
  }
  if (message.content == 'embed') {
    const embed = new WebEmbed()
      .setAuthor({ name: 'hello', url: 'https://google.com' })
      .setColor('RED')
      .setDescription('description uh')
      .setProvider({ name: 'provider', url: 'https://google.com' })
      .setTitle('This is Title')
      .setURL('https://google.com')
      .setImage('https://i.ytimg.com/vi/iBP8HambzpY/maxresdefault.jpg')
      .setRedirect('https://www.youtube.com/watch?v=iBP8HambzpY')
      .setVideo('http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
    message.channel.send({
      content: `${embed}`,
    });
  }
});

client.login('token');
