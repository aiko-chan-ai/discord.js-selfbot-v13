'use strict';

const BaseMessageComponent = require('./BaseMessageComponent');
const { MessageComponentTypes } = require('../util/Constants');

class ContainerComponent extends BaseMessageComponent {
  /**
   * 
   * @param {*} data 
   */
  constructor(data = {}) {
    super({ type: 'CONTAINER' }, data);
    this.components = data.components?.map(c => BaseMessageComponent.create(c)) ?? null;
    this.accent_color = data.accent_color ?? null;
    this.spoiler = data.spoiler ?? false;
  }

  toJSON() {
    return {
      type: MessageComponentTypes[this.type],
      components: this.components.map(c => c.toJSON()),
      accent_color: this.accent_color,
      spoiler: this.spoiler,
    };
  }
}

module.exports = ContainerComponent;