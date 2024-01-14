'use strict';

const BaseMessageComponent = require('./BaseMessageComponent');
const { ChannelTypes, MessageComponentTypes } = require('../util/Constants');
const Util = require('../util/Util');

/**
 * Represents a select menu message component
 * @extends {BaseMessageComponent}
 */
class MessageSelectMenu extends BaseMessageComponent {
  /**
   * @typedef {BaseMessageComponentOptions} MessageSelectMenuOptions
   * @property {string} [customId] A unique string to be sent in the interaction when clicked
   * @property {string} [placeholder] Custom placeholder text to display when nothing is selected
   * @property {number} [minValues] The minimum number of selections required
   * @property {number} [maxValues] The maximum number of selections allowed
   * @property {MessageSelectOption[]} [options] Options for the select menu
   * @property {boolean} [disabled=false] Disables the select menu to prevent interactions
   * @property {ChannelType[]} [channelTypes] List of channel types to include in the ChannelSelect component
   */

  /**
   * @typedef {Object} MessageSelectOption
   * @property {string} label The text to be displayed on this option
   * @property {string} value The value to be sent for this option
   * @property {?string} description Optional description to show for this option
   * @property {?RawEmoji} emoji Emoji to display for this option
   * @property {boolean} default Render this option as the default selection
   */

  /**
   * @typedef {Object} MessageSelectOptionData
   * @property {string} label The text to be displayed on this option
   * @property {string} value The value to be sent for this option
   * @property {string} [description] Optional description to show for this option
   * @property {EmojiIdentifierResolvable} [emoji] Emoji to display for this option
   * @property {boolean} [default] Render this option as the default selection
   */

  /**
   * @param {MessageSelectMenu|MessageSelectMenuOptions} [data={}] MessageSelectMenu to clone or raw data
   */
  constructor(data = {}) {
    super({ type: BaseMessageComponent.resolveType(data.type) ?? 'STRING_SELECT' });

    this.setup(data);
  }

  setup(data) {
    /**
     * A unique string to be sent in the interaction when clicked
     * @type {?string}
     */
    this.customId = data.custom_id ?? data.customId ?? null;

    /**
     * Custom placeholder text to display when nothing is selected
     * @type {?string}
     */
    this.placeholder = data.placeholder ?? null;

    /**
     * The minimum number of selections required
     * @type {?number}
     */
    this.minValues = data.min_values ?? data.minValues ?? null;

    /**
     * The maximum number of selections allowed
     * @type {?number}
     */
    this.maxValues = data.max_values ?? data.maxValues ?? null;

    /**
     * Options for the STRING_SELECT menu
     * @type {MessageSelectOption[]}
     */
    this.options = this.constructor.normalizeOptions(data.options ?? []);

    /**
     * Whether this select menu is currently disabled
     * @type {boolean}
     */
    this.disabled = data.disabled ?? false;

    /**
     * Channels that are possible to select in CHANNEL_SELECT menu
     * @type {ChannelType[]}
     */
    this.channelTypes =
      data.channel_types?.map(channelType =>
        typeof channelType === 'string' ? channelType : ChannelTypes[channelType],
      ) ?? [];
  }

  /**
   * Transforms the select menu into a plain object
   * @returns {APIMessageSelectMenu} The raw data of this select menu
   */
  toJSON() {
    return {
      channel_types: this.channelTypes.map(type => (typeof type === 'string' ? ChannelTypes[type] : type)),
      custom_id: this.customId,
      disabled: this.disabled,
      placeholder: this.placeholder,
      min_values: this.minValues,
      max_values: this.maxValues ?? (this.minValues ? this.options.length : undefined),
      options: this.options,
      type: typeof this.type === 'string' ? MessageComponentTypes[this.type] : this.type,
    };
  }

  /**
   * Normalizes option input and resolves strings and emojis.
   * @param {MessageSelectOptionData} option The select menu option to normalize
   * @returns {MessageSelectOption}
   */
  static normalizeOption(option) {
    let { label, value, description, emoji } = option;

    label = Util.verifyString(label, RangeError, 'SELECT_OPTION_LABEL');
    value = Util.verifyString(value, RangeError, 'SELECT_OPTION_VALUE');
    emoji = emoji ? Util.resolvePartialEmoji(emoji) : null;
    description = description ? Util.verifyString(description, RangeError, 'SELECT_OPTION_DESCRIPTION', true) : null;

    return { label, value, description, emoji, default: option.default ?? false };
  }

  /**
   * Normalizes option input and resolves strings and emojis.
   * @param {...MessageSelectOptionData|MessageSelectOptionData[]} options The select menu options to normalize
   * @returns {MessageSelectOption[]}
   */
  static normalizeOptions(...options) {
    return options.flat(Infinity).map(option => this.normalizeOption(option));
  }
}

module.exports = MessageSelectMenu;
