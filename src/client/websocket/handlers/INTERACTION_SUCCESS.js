'use strict';
const { Events } = require('../../../util/Constants');

module.exports = (client, { d: data }) => {
  /**
   * Emitted whenever client user send interaction and success
   * @event Client#interactionSuccess
   * @param {InteractionResponseBody} data data
   */
  client.emit(Events.INTERACTION_SUCCESS, data);
  // Get channel data
  const cache = client._interactionCache.get(data.nonce);
  if (!cache) return;
  const channel = cache.guildId
    ? client.guilds.cache.get(cache.guildId)?.channels.cache.get(cache.channelId)
    : client.channels.cache.get(cache.channelId);
  // Set data
  const interaction = {
    ...cache,
    ...data,
  };
  const data_ = channel.interactions._add(interaction);
  client.emit('interactionResponse', {
    status: true,
    metadata: data_,
    error: 'Success',
  });
  // Delete cache
  // client._interactionCache.delete(data.nonce);
};
