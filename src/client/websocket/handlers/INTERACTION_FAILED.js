'use strict';
const { Events } = require('../../../util/Constants');

module.exports = (client, { d: data }) => {
  client.emit(Events.INTERACTION_FAILED, data);
};
