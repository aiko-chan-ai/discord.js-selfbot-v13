'use strict';

function parseStreamKey(key) {
  const Arr = key.split(':');
  const type = Arr[0];
  const guildId = type == 'guild' ? Arr[1] : null;
  const channelId = type == 'guild' ? Arr[2] : Arr[1];
  const userId = type == 'guild' ? Arr[3] : Arr[2];
  return { type, guildId, channelId, userId };
}

module.exports = {
  parseStreamKey,
};
