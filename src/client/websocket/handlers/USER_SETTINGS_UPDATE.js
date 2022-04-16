'use strict';

module.exports = (client, { d: data }) => {
  client.setting._patch(data);
};
