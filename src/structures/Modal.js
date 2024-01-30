'use strict';

const { setTimeout } = require('node:timers');
const BaseMessageComponent = require('./BaseMessageComponent');
const { InteractionTypes, Events } = require('../util/Constants');
const SnowflakeUtil = require('../util/SnowflakeUtil');

/**
 * Represents a modal (form) to be shown in response to an interaction
 */
class Modal {
  /**
   * @param {Object} data Modal to clone or raw data
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
    this.customId = data.custom_id;

    /**
     * The title to be displayed on this modal
     * @type {?string}
     */
    this.title = data.title;

    /**
     * Timestamp (Discord epoch) of when this modal was created
     * @type {Snowflake}
     */
    this.nonce = data.nonce;

    /**
     * ID slash / button / menu when modal is displayed
     * @type {Snowflake}
     */
    this.id = data.id;

    /**
     * Application sending the modal
     * @type {Snowflake}
     */
    this.applicationId = data.application.id;

    /**
     * The id of the channel the message was sent in
     * @type {Snowflake}
     */
    this.channelId = data.channel_id;

    Object.defineProperty(this, 'client', {
      value: client,
      writable: false,
    });
  }

  /**
   * The id of the guild the message was sent in, if any
   * @type {?Snowflake}
   * @readonly
   */
  get guildId() {
    return this.client.channels.cache.get(this.channelId)?.guildId || null;
  }

  /**
   * The channel that the message was sent in
   * @type {TextBasedChannels}
   * @readonly
   */
  get channel() {
    return this.client.channels.resolve(this.channelId);
  }

  /**
   * The guild the message was sent in (if in a guild channel)
   * @type {?Guild}
   * @readonly
   */
  get guild() {
    return this.client.guilds.resolve(this.guildId) ?? this.channel?.guild ?? null;
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
   * Reply to this modal with data. (Event only)
   * @returns {Promise<Message|Modal>}
   * @example
   * client.on('interactionModalCreate', modal => {
   *    // Modal > ActionRow > TextInput
   *    modal.components[0].components[0].setValue('1+1');
   *    modal.components[1].components[0].setValue('hello');
   *    modal.reply();
   * })
   */
  reply() {
    if (!this.applicationId || !this.client || !this.channelId) throw new Error('Modal cannot reply');
    // Get Object
    const dataFinal = this.toJSON();
    dataFinal.components = dataFinal.components
      .map(c => {
        c.components[0] = {
          type: c.components[0].type,
          value: c.components[0].value,
          custom_id: c.components[0].custom_id,
        };
        return c;
      })
      .filter(c => typeof c.components[0].value == 'string');
    delete dataFinal.title;
    const nonce = SnowflakeUtil.generate();
    const postData = {
      type: InteractionTypes.MODAL_SUBMIT, // Modal
      application_id: this.applicationId,
      guild_id: this.guildId,
      channel_id: this.channelId,
      data: dataFinal,
      nonce,
      session_id: this.client.sessionId,
    };
    this.client.api.interactions.post({
      data: postData,
    });
    return new Promise((resolve, reject) => {
      const timeoutMs = 5_000;
      // Waiting for MsgCreate / ModalCreate
      const handler = data => {
        if (data.nonce !== nonce) return;
        clearTimeout(timeout);
        this.client.removeListener(Events.MESSAGE_CREATE, handler);
        this.client.removeListener(Events.INTERACTION_MODAL_CREATE, handler);
        this.client.decrementMaxListeners();
        resolve(data);
      };
      const timeout = setTimeout(() => {
        this.client.removeListener(Events.MESSAGE_CREATE, handler);
        this.client.removeListener(Events.INTERACTION_MODAL_CREATE, handler);
        this.client.decrementMaxListeners();
        reject(new Error('INTERACTION_FAILED'));
      }, timeoutMs).unref();
      this.client.incrementMaxListeners();
      this.client.on(Events.MESSAGE_CREATE, handler);
      this.client.on(Events.INTERACTION_MODAL_CREATE, handler);
    });
  }

  // TypeScript
  /**
   * Check data
   * @type {boolean}
   * @readonly
   */
  get isMessage() {
    return false;
  }
}

module.exports = Modal;
