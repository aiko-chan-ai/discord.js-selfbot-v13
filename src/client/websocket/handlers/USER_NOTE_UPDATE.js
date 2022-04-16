'use strict';

module.exports = (client, { d: data }) => {
  client.user.notes.set(data.id, data.note);
};
