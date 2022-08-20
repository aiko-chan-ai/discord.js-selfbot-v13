'use strict';
const { Events } = require('../../../util/Constants');
module.exports = (client, { d: data }) => {
  client.settings._patch(data);
  if (('status' in data || 'custom_status' in data) && client.options.readyStatus) {
    client.customStatusAuto(client);
  }
  return client.emit(Events.USER_SETTINGS_UPDATE, data);
};
