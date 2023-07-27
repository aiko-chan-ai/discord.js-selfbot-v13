'use strict';

const { setTimeout } = require('node:timers');
const BaseMessageComponent = require('./BaseMessageComponent');
const {
  ChannelTypes,
  MessageComponentTypes,
  SelectMenuComponentTypes,
  InteractionTypes,
} = require('../util/Constants');
const SnowflakeUtil = require('../util/SnowflakeUtil');
const { lazy } = require('../util/Util');
const Message = lazy(() => require('./Message').Message);
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
   * Adds the channel types to the select menu
   * @param {...ChannelType[]} channelTypes Added channel types
   * @returns {MessageSelectMenu}
   */
  addChannelTypes(...channelTypes) {
    if (!channelTypes.every(channelType => ChannelTypes[channelType])) {
      throw new TypeError('INVALID_TYPE', 'channelTypes', 'Rest<ChannelTypes[]>');
    }
    this.channelTypes.push(
      ...channelTypes.map(channelType => (typeof channelType === 'string' ? channelType : ChannelTypes[channelType])),
    );
    return this;
  }

  /**
   * Sets the channel types of the select menu
   * @param {...ChannelType[]} channelTypes An array of new channel types
   * @returns {MessageSelectMenu}
   */
  setChannelTypes(...channelTypes) {
    if (!channelTypes.every(channelType => ChannelTypes[channelType])) {
      throw new TypeError('INVALID_TYPE', 'channelTypes', 'Rest<ChannelTypes[]>');
    }
    this.channelTypes = channelTypes.map(channelType =>
      typeof channelType === 'string' ? channelType : ChannelTypes[channelType],
    );
    return this;
  }

  /**
   * Sets the custom id of this select menu
   * @param {string} customId A unique string to be sent in the interaction when clicked
   * @returns {MessageSelectMenu}
   */
  setCustomId(customId) {
    this.customId = Util.verifyString(customId, RangeError, 'SELECT_MENU_CUSTOM_ID');
    return this;
  }

  /**
   * Sets the interactive status of the select menu
   * @param {boolean} [disabled=true] Whether this select menu should be disabled
   * @returns {MessageSelectMenu}
   */
  setDisabled(disabled = true) {
    this.disabled = disabled;
    return this;
  }

  /**
   * Sets the maximum number of selections allowed for this select menu
   * @param {number} maxValues Number of selections to be allowed
   * @returns {MessageSelectMenu}
   */
  setMaxValues(maxValues) {
    this.maxValues = maxValues;
    return this;
  }

  /**
   * Sets the minimum number of selections required for this select menu
   * <info>This will default the maxValues to the number of options, unless manually set</info>
   * @param {number} minValues Number of selections to be required
   * @returns {MessageSelectMenu}
   */
  setMinValues(minValues) {
    this.minValues = minValues;
    return this;
  }

  /**
   * Sets the placeholder of this select menu
   * @param {string} placeholder Custom placeholder text to display when nothing is selected
   * @returns {MessageSelectMenu}
   */
  setPlaceholder(placeholder) {
    this.placeholder = Util.verifyString(placeholder, RangeError, 'SELECT_MENU_PLACEHOLDER');
    return this;
  }

  /**
   * Sets the type of the select menu
   * @param {SelectMenuComponentType} type Type of the select menu
   * @returns {MessageSelectMenu}
   */
  setType(type) {
    if (!SelectMenuComponentTypes[type]) throw new TypeError('INVALID_TYPE', 'type', 'SelectMenuComponentType');
    this.type = BaseMessageComponent.resolveType(type);
    return this;
  }

  /**
   * Adds options to the select menu.
   * @param {...MessageSelectOptionData|MessageSelectOptionData[]} options The options to add
   * @returns {MessageSelectMenu}
   */
  addOptions(...options) {
    this.options.push(...this.constructor.normalizeOptions(options));
    return this;
  }

  /**
   * Sets the options of the select menu.
   * @param {...MessageSelectOptionData|MessageSelectOptionData[]} options The options to set
   * @returns {MessageSelectMenu}
   */
  setOptions(...options) {
    this.spliceOptions(0, this.options.length, options);
    return this;
  }

  /**
   * Removes, replaces, and inserts options in the select menu.
   * @param {number} index The index to start at
   * @param {number} deleteCount The number of options to remove
   * @param {...MessageSelectOptionData|MessageSelectOptionData[]} [options] The replacing option objects
   * @returns {MessageSelectMenu}
   */
  spliceOptions(index, deleteCount, ...options) {
    this.options.splice(index, deleteCount, ...this.constructor.normalizeOptions(...options));
    return this;
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

  // Add
  /**
   * Mesage select menu
   * @param {Message} message The message this select menu is for
   * @param {Array<any>} values The values of the select menu
   * @returns {Promise<InteractionResponse>}
   */
  async select(message, values) {
    if (!(message instanceof Message())) throw new Error('[UNKNOWN_MESSAGE] Please pass a valid Message');
    if (!Array.isArray(values)) throw new TypeError('[INVALID_VALUES] Please pass an array of values');
    if (!this.customId || this.disabled) {
      throw new Error('[INVALID_MENU] Menu does not contain Id or has been disabled');
    } // Disabled or null customID
    if (values.length < this.minValues) {
      throw new RangeError(`[SELECT_MENU_MIN_VALUES] The minimum number of values is ${this.minValues}`);
    }
    if (values.length > this.maxValues) {
      throw new RangeError(`[SELECT_MENU_MAX_VALUES] The maximum number of values is ${this.maxValues}`);
    }
    const parseValues = value => {
      switch (this.type) {
        case 'SELECT_MENU':
        case 'STRING_SELECT': {
          if (typeof value !== 'string') throw new TypeError('[INVALID_VALUE] Please pass a string value');
          const value_ = this.options.find(obj => obj.value === value || obj.label === value);
          if (!value_) throw new Error('[INVALID_VALUE] Please pass a valid value');
          return value_.value;
        }
        case 'USER_SELECT': {
          const userId = this.client.users.resolveId(value);
          if (!userId) throw new Error('[INVALID_VALUE] Please pass a valid user');
          return userId;
        }
        case 'ROLE_SELECT': {
          const roleId = this.client.roles.resolveId(value);
          if (!roleId) throw new Error('[INVALID_VALUE] Please pass a valid role');
          return roleId;
        }
        case 'MENTIONABLE_SELECT': {
          const mentionableId = this.client.users.resolveId(value) || this.client.roles.resolveId(value);
          if (!mentionableId) throw new Error('[INVALID_VALUE] Please pass a valid mentionable');
          return mentionableId;
        }
        case 'CHANNEL_SELECT': {
          const channel = this.client.channels.resolve(value);
          if (!channel) throw new Error('[INVALID_VALUE] Please pass a valid channel');
          if (!this.channelTypes.includes(channel.type)) {
            throw new Error(
              `[INVALID_VALUE] Please pass a valid channel type (Got: ${channel.type}, allow: ${this.channelTypes.join(
                ', ',
              )})`,
            );
          }
          return channel.id;
        }
        default: {
          throw new Error(`[INVALID_TYPE] Please pass a valid select menu type (Got ${this.type})`);
        }
      }
    };

    const nonce = SnowflakeUtil.generate();
    const data = {
      type: InteractionTypes.MESSAGE_COMPONENT,
      guild_id: message.guild?.id ?? null,
      channel_id: message.channel.id,
      message_id: message.id,
      application_id: message.applicationId ?? message.author.id,
      session_id: message.client.sessionId,
      message_flags: message.flags.bitfield,
      data: {
        component_type: MessageComponentTypes[this.type],
        custom_id: this.customId,
        type: MessageComponentTypes[this.type],
        values: values?.length ? values.map(parseValues) : [],
      },
      nonce,
    };

    await message.client.api.interactions.post({
      data,
    });
    message.client._interactionCache.set(nonce, {
      channelId: message.channelId,
      guildId: message.guildId,
      metadata: data,
    });
    return new Promise((resolve, reject) => {
      const handler = data => {
        timeout.refresh();
        if (data.metadata?.nonce !== nonce) return;
        clearTimeout(timeout);
        message.client.removeListener('interactionResponse', handler);
        message.client.decrementMaxListeners();
        if (data.status) {
          resolve(data.metadata);
        } else {
          reject(
            new Error('INTERACTION_ERROR', {
              cause: data,
            }),
          );
        }
      };
      const timeout = setTimeout(() => {
        message.client.removeListener('interactionResponse', handler);
        message.client.decrementMaxListeners();
        reject(
          new Error('INTERACTION_TIMEOUT', {
            cause: data,
          }),
        );
      }, message.client.options.interactionTimeout).unref();
      message.client.incrementMaxListeners();
      message.client.on('interactionResponse', handler);
    });
  }
}

module.exports = MessageSelectMenu;
