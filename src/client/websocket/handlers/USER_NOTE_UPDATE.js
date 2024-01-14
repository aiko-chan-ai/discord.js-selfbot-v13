'use strict';

module.exports = (client, { d: data }) => {
  client.notes.cache.set(data.id, data.note);
};
