'use strict';

let ClientUser;
const { VoiceConnection } = require('@discordjs/voice');
const axios = require('axios');
const chalk = require('chalk');
const Discord = require('../../../index');
const { Events, Opcodes } = require('../../../util/Constants');
const { VoiceConnection: VoiceConnection_patch } = require('../../../util/Voice');
let running = false;
/**
 * Emitted whenever clientOptions.checkUpdate = false
 * @event Client#update
 * @param {string} oldVersion Current version
 * @param {string} newVersion Latest version
 */

async function checkUpdate(client) {
  const res_ = await axios
    .get(`https://registry.npmjs.com/${encodeURIComponent('discord.js-selfbot-v13')}`)
    .catch(() => {});
  if (!res_) {
    return client.emit(Events.DEBUG, `${chalk.redBright('[Fail]')} Check Update error`);
  }
  const latest_tag = res_.data['dist-tags'].latest;
  if (client.options.checkUpdate) {
    if (latest_tag !== Discord.version && Discord.version.includes('-') == false) {
      if (!running) {
        console.log(`
      ${chalk.yellowBright('[WARNING]')} New Discord.js-selfbot-v13 version.
      Current: ${chalk.redBright(Discord.version)} => Latest: ${chalk.greenBright(latest_tag)}
  
      If you don't want to show this message, set ${chalk.cyanBright('checkUpdate')} to false
  
      new Client({
          checkUpdate: false,
      });
  
      and using event update
      https://discordjs-self-v13.netlify.app/#/docs/docs/main/class/Client?scrollTo=e-update\n`);
      }
    } else if (!running) {
      console.log(
        `
      ${chalk.greenBright('[OK]')} Discord.js-selfbot-v13 is up to date. Current: ${chalk.blueBright(Discord.version)}
  
      If you don't want to show this message, set ${chalk.cyanBright('checkUpdate')} to false
  
      new Client({
          checkUpdate: false,
      });
  
      and using event update
      https://discordjs-self-v13.netlify.app/#/docs/docs/main/class/Client?scrollTo=e-update\n`,
      );
    }
  } else {
    client.emit('update', Discord.version, latest_tag);
  }
  running = true;
  return undefined;
}

module.exports = async (client, { d: data }, shard) => {
  checkUpdate(client);

  if (client.options.patchVoice && !running) {
    /* eslint-disable */
    VoiceConnection.prototype.configureNetworking = VoiceConnection_patch.prototype.configureNetworking;
    client.emit(
      Events.DEBUG,
      `${chalk.greenBright('[OK]')} Patched ${chalk.cyanBright(
        'VoiceConnection.prototype.configureNetworking',
      )} [${chalk.bgMagentaBright('@discordjs/voice')} - ${chalk.redBright('v0.11.0')}]`,
    );
    /* eslint-enable */
  }

  client.session_id = data.session_id;
  if (client.user) {
    client.user._patch(data.user);
  } else {
    ClientUser ??= require('../../../structures/ClientUser');
    client.user = new ClientUser(client, data.user);
    client.users.cache.set(client.user.id, client.user);
  }

  client.user.setAFK(false);

  client.settings._patch(data.user_settings);

  client.user.connectedAccounts = data.connected_accounts ?? [];

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

  if (client.options.readyStatus && !running) {
    client.customStatusAuto(client);
  }

  for (const guild of data.guilds) {
    guild.shardId = shard.id;
    client.guilds._add(guild);
  }

  // Receive messages in large guilds
  for (const guild of data.guilds) {
    await client.sleep(client.options.messageCreateEventGuildTimeout);
    client.ws.broadcast({
      op: Opcodes.LAZY_REQUEST,
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

  client.relationships._setup(data.relationships);

  shard.checkReady();
};
