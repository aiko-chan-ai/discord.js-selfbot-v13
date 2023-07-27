'use strict';

const Util = require('../../../util/Util');

module.exports = (client, { d: data }) => Util.clientRequiredAction(client, data.required_action);
