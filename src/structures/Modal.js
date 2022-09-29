'use strict';

const BaseMessageComponent = require('./BaseMessageComponent');
const User = require('./User');
const SnowflakeUtil = require('../util/SnowflakeUtil');
const Util = require('../util/Util');

/**
 * Represents a modal (form) to be shown in response to an interaction
 */
class Modal {
  /**
   * @typedef {Object} ModalOptions
   * @property {string} [customId] A unique string to be sent in the interaction when clicked
   * @property {string} [title] The title to be displayed on this modal
   * @property {MessageActionRow[]|MessageActionRowOptions[]} [components]
   * Action rows containing interactive components for the modal (text input components)
   */

  /**
   * @param {Modal|ModalOptions} data Modal to clone or raw data
   * @param {Client} client The client constructing this Modal, if provided
   */
  constructor(data = {}, client = null) {
    /**
     * A list of MessageActionRows in the modal
     * @type {MessageActionRow[]}
     */
    this.components = data.components?.map(c => BaseMessageComponent.create(c, client)) ?? [];

    /**
     * A unique string to be sent in the interaction when submitted
     * @type {?string}
     */
    this.customId = data.custom_id ?? data.customId ?? null;

    /**
     * The title to be displayed on this modal
     * @type {?string}
     */
    this.title = data.title ?? null;

    /**
     * Timestamp (Discord epoch) of when this modal was created
     * @type {?Snowflake}
     */
    this.nonce = data.nonce ?? null;

    /**
     * ID slash / button / menu when modal is displayed
     * @type {?Snowflake}
     */
    this.id = data.id ?? null;

    /**
     * Application sending the modal
     * @type {?Object}
     */
    this.application = data.application
      ? {
          ...data.application,
          bot: data.application.bot ? new User(client, data.application.bot) : null,
        }
      : null;

    this.client = client;
  }

  /**
   * Adds components to the modal.
   * @param {...MessageActionRowResolvable[]} components The components to add
   * @returns {Modal}
   */
  addComponents(...components) {
    this.components.push(...components.flat(Infinity).map(c => BaseMessageComponent.create(c)));
    return this;
  }

  /**
   * Sets the components of the modal.
   * @param {...MessageActionRowResolvable[]} components The components to set
   * @returns {Modal}
   */
  setComponents(...components) {
    this.spliceComponents(0, this.components.length, components);
    return this;
  }

  /**
   * Sets the custom id for this modal
   * @param {string} customId A unique string to be sent in the interaction when submitted
   * @returns {Modal}
   */
  setCustomId(customId) {
    this.customId = Util.verifyString(customId, RangeError, 'MODAL_CUSTOM_ID');
    return this;
  }

  /**
   * Removes, replaces, and inserts components in the modal.
   * @param {number} index The index to start at
   * @param {number} deleteCount The number of components to remove
   * @param {...MessageActionRowResolvable[]} [components] The replacing components
   * @returns {Modal}
   */
  spliceComponents(index, deleteCount, ...components) {
    this.components.splice(index, deleteCount, ...components.flat(Infinity).map(c => BaseMessageComponent.create(c)));
    return this;
  }

  /**
   * Sets the title of this modal
   * @param {string} title The title to be displayed on this modal
   * @returns {Modal}
   */
  setTitle(title) {
    this.title = Util.verifyString(title, RangeError, 'MODAL_TITLE');
    return this;
  }

  toJSON() {
    return {
      components: this.components.map(c => c.toJSON()),
      custom_id: this.customId,
      title: this.title,
      id: this.id,
    };
  }

  /**
   * @typedef {Object} TextInputComponentReplyData
   * @property {string} [customId] TextInputComponent custom id
   * @property {string} [value] TextInputComponent value
   */

  /**
   * @typedef {Object} ModalReplyData
   * @property {GuildResolvable} [guild] Guild to send the modal to
   * @property {TextChannelResolvable} [channel] User to send the modal to
   * @property {TextInputComponentReplyData[]} [data] Reply data
   */

  /**
   * Reply to this modal with data. (Event only)
   * @param  {ModalReplyData} data Data to send with the modal
   * @returns {Promise<InteractionResponseBody>}
   * @example
   * // With Event
   * client.on('interactionModalCreate', modal => {
   *  modal.reply('guildId', 'channelId', {
   *    customId: 'code',
   *    value: '1+1'
   *  }, {
   *    customId: 'message',
   *    value: 'hello'
   *  })
   * })
   */
  async reply(data) {
    if (typeof data !== 'object') throw new TypeError('ModalReplyData must be an object');
    if (!Array.isArray(data.data)) throw new TypeError('ModalReplyData.data must be an array');
    if (!this.application) throw new Error('Modal cannot reply (Missing Application)');
    const guild = this.client.guilds.resolveId(data.guild);
    const channel = this.client.channels.resolveId(data.channel);
    // Add data to components
    // this.components = [ MessageActionRow.components = [ TextInputComponent ] ]
    // 5 MessageActionRow / Modal, 1 TextInputComponent / 1 MessageActionRow
    for (let i = 0; i < this.components.length; i++) {
      const value = data.data.find(d => d.customId == this.components[i].components[0].customId);
      if (this.components[i].components[0].required == true) {
        if (!value) {
          throw new Error(
            'MODAL_REQUIRED_FIELD_MISSING\n' +
              `Required fieldId ${this.components[i].components[0].customId} missing value`,
          );
        }
        if (!(typeof value?.value == 'string')) {
          throw new Error(
            'MODAL_REPLY_DATA_INVALID\n' +
              `Data (Required) must be strings, got ${typeof value.value} [Custom ID: ${value.customId}]`,
          );
        }
      }
      if (value) {
        if (!(typeof value?.value == 'string')) {
          console.warn(
            'Warning: MODAL_REPLY_DATA_INVALID',
            `Data (Not required) must be strings, got ${typeof value.value} [Custom ID: ${value.customId}]`,
          );
          continue;
        }
        this.components[i].components[0].value = value.value;
      }
      delete this.components[i].components[0].maxLength;
      delete this.components[i].components[0].minLength;
      delete this.components[i].components[0].required;
      delete this.components[i].components[0].placeholder;
      delete this.components[i].components[0].label;
      delete this.components[i].components[0].style;
    }
    // Filter
    this.components = this.components.filter(c => c.components[0].value && c.components[0].value !== '');
    // Get Object
    const dataFinal = this.toJSON();
    delete dataFinal.title;
    const nonce = SnowflakeUtil.generate();
    const postData = {
      type: 5, // Modal
      application_id: this.application.id,
      guild_id: guild || null,
      channel_id: channel,
      data: dataFinal,
      nonce,
      session_id: this.client.session_id,
    };
    await this.client.api.interactions.post({
      data: postData,
    });
    return {
      nonce,
      id: this.id,
    };
  }
}

module.exports = Modal;
