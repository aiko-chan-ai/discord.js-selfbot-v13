'use strict';
const Modal = require('../../../structures/Modal');
const { Events } = require('../../../util/Constants');
module.exports = (client, { d: data }) => {
  /**
   * Emitted whenever client user receive interaction.showModal()
   * @event Client#interactionModalCreate
   * @param {Modal} modal The modal (extended)
   */
  client.emit(Events.INTERACTION_MODAL_CREATE, new Modal(data, client));
};
