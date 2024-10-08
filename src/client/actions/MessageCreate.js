'use strict';

const process = require('node:process');
const Action = require('./Action');
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
