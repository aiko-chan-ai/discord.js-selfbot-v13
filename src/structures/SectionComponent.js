'use strict';

const BaseMessageComponent = require('./BaseMessageComponent');
const { MessageComponentTypes } = require('../util/Constants');

class SectionComponent extends BaseMessageComponent {
  /**
   * @property {TextDisplayComponent[]} [components] One to three text components
   * @property {ThumbnailComponent|MessageButton} [accessory] A thumbnail or a button component, with a future possibility of adding more compatible components
   */

  /**
   * @param {SectionComponent | APISectionComponent} [data={}] The data
   */
  constructor(data = {}) {
    super({ type: 'SECTION' });

    this.setup(data);
  }

  setup(data) {
    super.setup(data);
    /**
     * One to three text components
     * @type {TextDisplayComponent[]}
     */
    this.components = data.components?.map(c => BaseMessageComponent.create(c)) ?? [];

    /**
     * A thumbnail or a button component, with a future possibility of adding more compatible components
     * @type {ThumbnailComponent|MessageButton}
     */
    this.accessory = BaseMessageComponent.create(data.accessory) ?? null;
  }

  /**
   * @returns {APISectionComponent}
   */
  toJSON() {
    return {
      type: MessageComponentTypes[this.type],
      components: this.components.map(c => c.toJSON()),
      accessory: this.accessory.toJSON(),
    };
  }
}

module.exports = SectionComponent;
