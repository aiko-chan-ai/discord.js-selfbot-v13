'use strict';

const process = require('node:process');
const Action = require('./Action');
const { Collection } = require('@discordjs/collection');
const { ReadState } = require('../../structures/ReadState');
const { Events } = require('../../util/Constants');

let deprecationEmitted = false;

class MessageCreateAction extends Action {
  handle(data) {
    const client = this.client;
    const channel = this.getChannel({
      id: data.channel_id,
      author: data.author,
      ...('guild_id' in data && { guild_id: data.guild_id }),
    });
    if (channel) {
      if (!channel.isText()) return {};

      const existing = channel.messages.cache.get(data.id);
      if (existing && existing.author?.id !== this.client.user.id) return { message: existing };
      const message = existing ?? channel.messages._add(data);
      channel.lastMessageId = data.id;

      let settings = (message.guild?.settings ?? this.client.guildSettings) ?? {
        muted: false,
        suppressEveryone: false,
        suppressRoles: false,
      };
      let implicitAck = message.author?.id == this.client.user.id;
      let mentioned = (
        message.author?.relationship !== 'BLOCKED'
        && !(channel.type === 'GROUP_DM' && message.type === 'RECIPIENT_REMOVE')
        || (['DM', 'GROUP_DM'].includes(channel.type) && (settings.muteConfig?.endTime?.getTime() ?? 0) <= Date.now() && (settings.channelOverrides?.find(override => override.channel_id == channel.id)?.muteConfig?.endTime?.getTime() ?? 0) <= Date.now())
        || message.mentions.users.has(this.client.user.id)
        || (message.mentions.everyone && !settings.suppressEveryone)
        || (message.mentions.roles?.hasAny(message.guild?.members?.me?._roles ?? []) && !settings.suppressRoles)
      );
      
      if (implicitAck || mentioned) {
        let readStates = client.readStates.cache.get('CHANNEL');
        if (readStates) {
          let readState = readStates?.get(channel.id);
          if (readState) {
            if (implicitAck) readState.lastAckedId = message.id;
            if (mentioned) readState.badgeCount++;
          } else {
            readState = new ReadState(this.client, {
              id: channel.id,
              read_state_type: 0,
              badge_count: +mentioned,
              last_viewed: null,
              last_pin_timestamp: null,
              last_acked_id: implicitAck ? message.id : null,
            });
            readStates.set(readState.id, readState);
          }
        } else {
          readStates = new Collection();
          let readState = new ReadState(this.client, {
            id: channel.id,
            read_state_type: 0,
            badge_count: +mentioned,
            last_viewed: null,
            last_pin_timestamp: null,
            last_acked_id: implicitAck ? message.id : null,
          });
          readStates.set(readState.id, readState);
          client.readStates.cache.set('CHANNEL', readStates);
        }
      }
      
      /**
       * Emitted whenever a message is created.
       * @event Client#messageCreate
       * @param {Message} message The created message
       */
      client.emit(Events.MESSAGE_CREATE, message);

      /**
       * Emitted whenever a message is created.
       * @event Client#message
       * @param {Message} message The created message
       * @deprecated Use {@link Client#event:messageCreate} instead
       */
      if (client.emit('message', message) && !deprecationEmitted) {
        deprecationEmitted = true;
        process.emitWarning('The message event is deprecated. Use messageCreate instead', 'DeprecationWarning');
      }

      return { message };
    }

    return {};
  }
}

module.exports = MessageCreateAction;
