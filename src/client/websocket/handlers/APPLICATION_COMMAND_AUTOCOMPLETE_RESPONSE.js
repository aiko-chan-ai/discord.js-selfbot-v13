'use strict';

const { Events } = require('../../../util/Constants');

module.exports = (client, { d: data }) => {
  /**
   * @typedef {object} AutocompleteResponseChoice
   * @property {string} name The name of the choice
   * @property {string} value The value of the choice
   */
  /**
   * @typedef {object} AutocompleteResponse
   * @property {Snowflake} [nonce] Snowflake of the data
   * @property {Array<AutocompleteResponseChoice>} [choices] Array of choices
   */
  /**
   * Emitted when receiving a response from Discord
   * @event Client#applicationCommandAutocompleteResponse
   * @param {AutocompleteResponse} data Data
   * @deprecated Test only
   */
  client.emit(Events.APPLICATION_COMMAND_AUTOCOMPLETE_RESPONSE, data);
};
