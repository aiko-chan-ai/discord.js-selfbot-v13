const { Client, RichPresence, CustomStatus, SpotifyRPC } = require('discord.js-selfbot-v13');
const client = new Client();

client.on('ready', async () => {
  console.log(`${client.user.username} is ready!`);
  const getExtendURL = await RichPresence.getExternal(
    client,
    '367827983903490050',
    'https://assets.ppy.sh/beatmaps/1550633/covers/list.jpg', // Required if the image you use is not in Discord
  );
  const status = new RichPresence(client)
    .setApplicationId('367827983903490050')
    .setType('PLAYING')
    .setURL('https://www.youtube.com/watch?v=5icFcPkVzMg') // If you set a URL, it will automatically change to STREAMING type
    .setState('Arcade Game')
    .setName('osu!')
    .setDetails('MariannE - Yooh')
    .setParty({
      max: 8,
      current: 1,
    })
    .setStartTimestamp(Date.now())
    .setAssetsLargeImage(getExtendURL[0].external_asset_path) // https://assets.ppy.sh/beatmaps/1550633/covers/list.jpg
    .setAssetsLargeText('Idle')
    .setAssetsSmallImage('373370493127884800') // https://discord.com/api/v9/oauth2/applications/367827983903490050/assets
    .setAssetsSmallText('click the circles')
    .setPlatform('desktop')
    .addButton('Beatmap', 'https://osu.ppy.sh/beatmapsets/1391659#osu/2873429');
  // Custom Status
  const custom = new CustomStatus(client).setEmoji('😋').setState('yum');
  // Spotify
  const spotify = new SpotifyRPC(client)
    .setAssetsLargeImage('spotify:ab67616d00001e02768629f8bc5b39b68797d1bb') // Image ID
    .setAssetsSmallImage('spotify:ab6761610000f178049d8aeae802c96c8208f3b7') // Image ID
    .setAssetsLargeText('未来茶屋 (vol.1)') // Album Name
    .setState('Yunomi; Kizuna AI') // Artists
    .setDetails('ロボットハート') // Song name
    .setStartTimestamp(Date.now())
    .setEndTimestamp(Date.now() + 1_000 * (2 * 60 + 56)) // Song length = 2m56s
    .setSongId('667eE4CFfNtJloC6Lvmgrx') // Song ID
    .setAlbumId('6AAmvxoPoDbJAwbatKwMb9') // Album ID
    .setArtistIds('2j00CVYTPx6q9ANbmB2keb', '2nKGmC5Mc13ct02xAY8ccS'); // Artist IDs

  client.user.setPresence({ activities: [status, custom, spotify] });
});

client.login('token');
