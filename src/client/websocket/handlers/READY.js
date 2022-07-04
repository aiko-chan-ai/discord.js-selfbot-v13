'use strict';

let ClientUser;
const { VoiceConnection, VoiceConnectionStatus } = require('@discordjs/voice');
const axios = require('axios');
const chalk = require('chalk');
const Discord = require('../../../index');
const { Events, Opcodes } = require('../../../util/Constants');
const { Networking } = require('../../../util/Voice');

/**
 * Emitted whenever clientOptions.checkUpdate = true
 * @event Client#update
 * @param {string} oldVersion Current version
 * @param {string} newVersion Latest version
 */

async function checkUpdate(client) {
  const res_ = await axios
    .get(`https://registry.npmjs.com/${encodeURIComponent('discord.js-selfbot-v13')}`)
    .catch(() => {});
  if (!res_) {
    return client.emit('update', `${chalk.redBright('[Fail]')} Check Update error`);
  }
  const lastest_tag = res_.data['dist-tags'].latest;
  if (client.options.checkUpdate) {
    if (lastest_tag !== Discord.version && Discord.version.includes('-') == false) {
      console.log(`
      ${chalk.yellowBright('[WARNING]')} New Discord.js-selfbot-v13 version.
      Current: ${chalk.redBright(Discord.version)} => Latest: ${chalk.greenBright(lastest_tag)}
  
      If you don't want to show this message, set \`checkUpdate\` to false
  
      new Client({
          checkUpdate: false,
      });
  
      and using event update
      https://discordjs-self-v13.netlify.app/#/docs/docs/main/class/Client?scrollTo=e-update`);
    } else {
      console.log(
        `
      ${chalk.greenBright('[OK]')} Discord.js-selfbot-v13 is up to date. Current: ${chalk.blueBright(Discord.version)}
  
      If you don't want to show this message, set \`checkUpdate\` to false
  
      new Client({
          checkUpdate: false,
      });
  
      and using event update
      https://discordjs-self-v13.netlify.app/#/docs/docs/main/class/Client?scrollTo=e-update`,
      );
    }
  }
  return client.emit('update', Discord.version, lastest_tag);
}

module.exports = (client, { d: data }, shard) => {
  checkUpdate(client);

  if (client.options.patchVoice) {
    /* eslint-disable */
    VoiceConnection.prototype.configureNetworking = function () {
      const { server, state } = this.packets;
      if (
        !server ||
        !state ||
        this.state.status === VoiceConnectionStatus.Destroyed /* Destroyed */ ||
        !server.endpoint
      )
        return;
      const networking = new Networking(
        {
          endpoint: server.endpoint,
          serverId: server.guild_id ?? server.channel_id,
          token: server.token,
          sessionId: state.session_id,
          userId: state.user_id,
        },
        Boolean(this.debug),
      );
      networking.once('close', this.onNetworkingClose);
      networking.on('stateChange', this.onNetworkingStateChange);
      networking.on('error', this.onNetworkingError);
      networking.on('debug', this.onNetworkingDebug);
      this.state = {
        ...this.state,
        status: VoiceConnectionStatus.Connecting /* Connecting */,
        networking,
      };
    };
    client.emit(
      Events.DEBUG,
      `${chalk.greenBright('[OK]')} Patched VoiceConnection.prototype.configureNetworking [@discordjs/voice - v0.10.0]`,
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

  client.setting._patch(data.user_settings);

  client.user.connectedAccounts = data.connected_accounts ?? [];

  client.user._patchNote(data.notes);

  for (const private_channel of data.private_channels) {
    client.channels._add(private_channel);
  }
  // Remove event because memory leak

  if (client.options.readyStatus) {
    client.customStatusAuto(client);
  }

  /**
   * Read_state: Return Array:
   *     {
   *      mention_count: 14, // ok it's ping count
   *      last_pin_timestamp: '1970-01-01T00:00:00+00:00', // why discord ?
   *      last_message_id: 0, // :)
   *      id: '840218426969817119' // channel id
   *	   },
   */

  /*
  for (const object of data.read_state) {
    if (object.mention_count == 0) continue;
    client.user.messageMentions.set(object.id, object);
  }
  */

  for (const guild of data.guilds) {
    guild.shardId = shard.id;
    client.guilds._add(guild);
  }

  // Receive messages in large guilds
  client.guilds.cache.map(guild => {
    client.ws.broadcast({
      op: Opcodes.LAZY_REQUEST,
      d: {
        guild_id: guild.id,
        typing: true,
        threads: false,
        activities: true,
        thread_member_lists: [],
        members: [],
        channels: {
          // [guild.channels.cache.first().id]: [[0, 99]],
        },
      },
    });
    return true;
  });

  client.relationships._setup(data.relationships);

  shard.checkReady();
};
