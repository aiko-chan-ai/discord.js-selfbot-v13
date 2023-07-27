'use strict';

let ClientUser;
const { VoiceConnection } = require('@discordjs/voice');
const chalk = require('chalk');
const { Events, Opcodes } = require('../../../util/Constants');
const Util = require('../../../util/Util');
const { VoiceConnection: VoiceConnection_patch } = require('../../../util/Voice');
let firstReady = false;

function patchVoice(client) {
  try {
    /* eslint-disable */
    VoiceConnection.prototype.configureNetworking = VoiceConnection_patch.prototype.configureNetworking;
    client.emit(
      'debug',
      `${chalk.greenBright('[OK]')} Patched ${chalk.cyanBright(
        'VoiceConnection.prototype.configureNetworking',
      )} [${chalk.bgMagentaBright('@discordjs/voice')} - ${chalk.redBright('v0.16.0')}]`,
    );
    /* eslint-enable */
  } catch (e) {
    client.emit(
      'debug',
      `${chalk.redBright('[Fail]')} Patched ${chalk.cyanBright(
        'VoiceConnection.prototype.configureNetworking',
      )} [${chalk.bgMagentaBright('@discordjs/voice')} - ${chalk.redBright('v0.16.0')}]\n${e.stack}`,
    );
    client.emit(
      Events.ERROR,
      `${chalk.redBright('[Fail]')} Patched ${chalk.cyanBright(
        'VoiceConnection.prototype.configureNetworking',
      )} [${chalk.bgMagentaBright('@discordjs/voice')} - ${chalk.redBright('v0.16.0')}]`,
    );
    client.emit(
      Events.ERROR,
      `${chalk.redBright('[Error]')} Please install ${chalk.bgMagentaBright(
        '@discordjs/voice',
      )} version ${chalk.redBright('v0.16.0')}`,
    );
  }
}

module.exports = async (client, { d: data }, shard) => {
  Util.clientRequiredAction(client, data.required_action);
  if (!firstReady) {
    if (client.options.checkUpdate) {
      client.once('update', (currentVersion, newVersion) => {
        if (!newVersion) {
          console.log(`
      ${chalk.redBright('[WARNING]')} Cannot check new Discord.js-selfbot-v13 version.
      Current: ${chalk.blueBright(currentVersion)}
  
      If you don't want to show this message, set ${chalk.cyanBright('checkUpdate')} to false
  
      const client = new Client({
          checkUpdate: false,
      });
  
      and using event update
      https://discordjs-self-v13.netlify.app/#/docs/docs/main/class/Client?scrollTo=e-update\n`);
        } else if (currentVersion !== newVersion && !currentVersion.includes('-')) {
          console.log(`
      ${chalk.yellowBright('[WARNING]')} New Discord.js-selfbot-v13 version.
      Current: ${chalk.redBright(currentVersion)} => Latest: ${chalk.greenBright(newVersion)}
  
      If you don't want to show this message, set ${chalk.cyanBright('checkUpdate')} to false
  
      const client = new Client({
          checkUpdate: false,
      });
  
      and using event update
      https://discordjs-self-v13.netlify.app/#/docs/docs/main/class/Client?scrollTo=e-update\n`);
        } else {
          console.log(
            `
      ${chalk.greenBright('[OK]')} Discord.js-selfbot-v13 is up to date. Current: ${chalk.blueBright(currentVersion)}
  
      If you don't want to show this message, set ${chalk.cyanBright('checkUpdate')} to false
  
      const client = new Client({
          checkUpdate: false,
      });
  
      and using event update
      https://discordjs-self-v13.netlify.app/#/docs/docs/main/class/Client?scrollTo=e-update\n`,
          );
        }
      });
      client.checkUpdate();
    }

    if (client.options.patchVoice) {
      patchVoice(client);
    }

    if (client.options.syncStatus) {
      client.customStatusAuto(client);
    }
    firstReady = true;
  }

  if (client.user) {
    client.user._patch(data.user);
  } else {
    ClientUser ??= require('../../../structures/ClientUser');
    client.user = new ClientUser(client, data.user);
    client.users.cache.set(client.user.id, client.user);
  }

  client.settings._patch(data.user_settings);

  client.user.connectedAccounts = data.connected_accounts ?? [];

  client.relationships._setup(data.relationships);

  client.user._patchNote(data.notes);

  const syncTime = Date.now();
  for (const private_channel of data.private_channels) {
    const channel = client.channels._add(private_channel);
    // Rate limit warning
    if (client.options.DMSync) {
      client.ws.broadcast({
        op: Opcodes.DM_UPDATE,
        d: {
          channel_id: channel.id,
        },
      });
    }
  }
  if (client.options.DMSync) {
    console.warn(
      `Gateway Rate Limit Warning: Sending ${data.private_channels.length} Requests / ${Date.now() - syncTime || 1} ms`,
    );
  }

  for (const guild of data.guilds) {
    guild.shardId = shard.id;
    client.guilds._add(guild);
  }

  for (const gSetting of Array.isArray(data.user_guild_settings) ? data.user_guild_settings : []) {
    const guild = client.guilds.cache.get(gSetting.guild_id);
    if (guild) guild.settings._patch(gSetting);
  }

  const largeGuilds = data.guilds.filter(g => g.large);

  client.emit('debug', `[READY] Received ${data.guilds.length} guilds, ${largeGuilds.length} large guilds`);

  // Receive messages in large guilds
  for (const guild of largeGuilds) {
    await client.sleep(client.options.messageCreateEventGuildTimeout);
    client.ws.broadcast({
      op: Opcodes.GUILD_SUBSCRIPTIONS,
      d: {
        guild_id: guild.id,
        typing: true,
        threads: true,
        activities: true,
        thread_member_lists: [],
        members: [],
        channels: {},
      },
    });
  }

  shard.checkReady();
};
