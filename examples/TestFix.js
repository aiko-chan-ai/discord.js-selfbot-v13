const { Client, RichPresence, CustomStatus } = require('discord.js-selfbot-v13');
const client = new Client();

client.on('ready', async () => {
  console.log(`${client.user.username} is ready!`);
  console.log('--- Starting Presence Verification Test ---');

  // 1. Set the Rich Presence
  console.log('Step 1: Setting Rich Presence...');
  const rpc = new RichPresence()
    .setApplicationId('367827983903490050') // Using osu! as an example
    .setType('PLAYING')
    .setName('osu!')
    .setDetails('Verifying RPC')
    .setState('Part 1/2 of the test')
    .setStartTimestamp(Date.now());

  client.user.setPresence({ activities: [rpc] });
  console.log('Rich Presence has been set. Please check your Discord profile.');
  console.log('Waiting 10 seconds before setting Custom Status...');

  // Wait for 10 seconds to observe the first state
  await new Promise(resolve => setTimeout(resolve, 10000));

  // 2. Set the Custom Status
  console.log('Step 2: Setting Custom Status...');
  const custom = new CustomStatus()
    .setEmoji('✅')
    .setState('Verification successful!');

  // With the fix, this call should MERGE the custom status with the existing RPC.
  // The expected outcome is that both activities are now present.
  client.user.setPresence({ activities: [custom] });
  console.log('Custom Status has been set.');
  console.log('Please check your Discord profile again. Both Rich Presence and Custom Status should be visible.');
  console.log('--- Test Complete ---');
});

// NOTE: A valid client token must be provided below to run this test.
client.login('token');
