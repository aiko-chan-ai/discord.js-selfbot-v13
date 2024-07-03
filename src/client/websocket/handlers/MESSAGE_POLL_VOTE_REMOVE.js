'use strict';

const { Events } = require('../../../util/Constants');

module.exports = (client, { d: data }) => {
  /**
   * Emitted when a user removes their vote on a poll. If the poll allows for multiple selections, one event will be sent per answer.
   * @event Client#messagePollVoteRemove
   * @param {MessagePollUserVote} data Raw data
   */
  client.emit(Events.MESSAGE_POLL_VOTE_REMOVE, data);
};
