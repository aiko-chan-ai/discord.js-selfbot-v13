'use strict';

const { setTimeout } = require('node:timers');
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
          bot: data.application.bot ? new User(client, data.application.bot, data.application) : null,
        }
      : null;

    this.client = client;
  }

  /**
   * Get Interaction Response
   * @type {?InteractionResponse}
   * @readonly
   */
  get sendFromInteraction() {
    if (this.id && this.nonce && this.client) {
      const cache = this.client._interactionCache.get(this.nonce);
      const channel = cache.guildId
        ? this.client.guilds.cache.get(cache.guildId)?.channels.cache.get(cache.channelId)
        : this.client.channels.cache.get(cache.channelId);
      return channel.interactions.cache.get(this.id);
    }
    return null;
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
   * @property {?GuildResolvable} [guild] Guild to send the modal to
   * @property {?TextChannelResolvable} [channel] User to send the modal to
   * @property {?TextInputComponentReplyData[]} [data] Reply data
   */

  /**
   * Reply to this modal with data. (Event only)
   * @param  {ModalReplyData} data Data to send with the modal
   * @returns {Promise<InteractionResponse>}
   * @example
   * client.on('interactionModalCreate', modal => {
   * // 1.
   *  modal.reply({
   *     data: [
   *         {
   *             customId: 'code',
   *             value: '1+1'
   *         }, {
   *             customId: 'message',
   *             value: 'hello'
   *         }
   *     ],
   *    channel: 'id', // optional
   *    guild: 'id', // optional
   *  })
   * // or 2.
   * modal.components[0].components[0].setValue('1+1');
   * modal.components[1].components[0].setValue('hello');
   * modal.reply();
   * })
   */
  async reply(data = {}) {
    if (!this.application) throw new Error('Modal cannot reply (Missing Application)');
    const data_cache = this.sendFromInteraction;
    const guild = this.client.guilds.resolveId(data?.guild) || data_cache.guildId || null;
    const channel = this.client.channels.resolveId(data?.channel) || data_cache.channelId;
    if (!channel) throw new Error('Modal cannot reply (Missing data)');
    // Add data to components
    // this.components = [ MessageActionRow.components = [ TextInputComponent ] ]
    // 5 MessageActionRow / Modal, 1 TextInputComponent / 1 MessageActionRow
    if (Array.isArray(data?.data) && data?.data?.length > 0) {
      for (let i = 0; i < this.components.length; i++) {
        const value = data.data.find(d => d.customId == this.components[i].components[0].customId);
        if (this.components[i].components[0].required == true && !value) {
          throw new Error(
            'MODAL_REQUIRED_FIELD_MISSING\n' +
              `Required fieldId ${this.components[i].components[0].customId} missing value`,
          );
        }
        if (value) {
          if (value?.value?.includes('\n') && this.components[i].components[0].style == 'SHORT') {
            throw new Error(
              'MODAL_REPLY_DATA_INVALID\n' +
                `value must be a single line, got multiple lines [Custom ID: ${value.customId}]`,
            );
          }
          this.components[i].components[0].setValue(value.value);
        }
      }
    }
    // Get Object
    const dataFinal = this.toJSON();
    dataFinal.components = dataFinal.components
      .map(c => {
        delete c.components[0].max_length;
        delete c.components[0].min_length;
        delete c.components[0].required;
        delete c.components[0].placeholder;
        delete c.components[0].label;
        delete c.components[0].style;
        return c;
      })
      .filter(c => c.components[0].value && c.components[0].value !== '');
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
    this.client._interactionCache.set(nonce, {
      channelId: channel,
      guildId: guild,
      metadata: postData,
    });
    return new Promise((resolve, reject) => {
      const handler = data => {
        timeout.refresh();
        if (data.metadata.nonce !== nonce) return;
        clearTimeout(timeout);
        this.client.removeListener('interactionResponse', handler);
        this.client.decrementMaxListeners();
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
        this.client.removeListener('interactionResponse', handler);
        this.client.decrementMaxListeners();
        reject(
          new Error('INTERACTION_TIMEOUT', {
            cause: postData,
          }),
        );
      }, this.client.options.interactionTimeout).unref();
      this.client.incrementMaxListeners();
      this.client.on('interactionResponse', handler);
    });
  }
}

module.exports = Modal;
