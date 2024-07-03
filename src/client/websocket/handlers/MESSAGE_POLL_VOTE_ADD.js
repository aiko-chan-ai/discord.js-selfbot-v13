'use strict';

const { Events } = require('../../../util/Constants');

module.exports = (client, { d: data }) => {
  /**
   * Poll Vote Structure
   * @see {@link https://docs.discord.sex/resources/message#poll-results-structure}
   * @typedef {Object} MessagePollUserVote
   * @property {Snowflake} user_id ID of the user
   * @property {Snowflake} channel_id ID of the channel
   * @property {Snowflake} message_id ID of the message
   * @property {?Snowflake} guild_id ID of the guild
   * @property {number} answer_id ID of the answer
   */
  /**
   * Emitted when a user votes on a poll. If the poll allows multiple selection, one event will be sent per answer.
   * @event Client#messagePollVoteAdd
   * @param {MessagePollUserVote} data Raw data
   */
  client.emit(Events.MESSAGE_POLL_VOTE_ADD, data);
};
