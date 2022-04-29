'use strict';
const { Events } = require('../../../util/Constants');
module.exports = (client, { d: data }) => {
  client.setting._patch(data);
  return client.emit(Events.USER_SETTINGS_UPDATE, data);
};
