'use strict';

const BaseMessageComponent = require('./BaseMessageComponent');
const { TextDisplayComponent } = require('./TextDisplayComponent');
const { MessageComponentTypes } = require('../util/Constants');

class SectionComponent extends BaseMessageComponent {
  constructor(data = {}) {
    super({ type: 'SECTION' });
    this.components = data.components?.map(c => BaseMessageComponent.create(c)) ?? [];
    this.accessory = BaseMessageComponent.create(data.accessory) ?? null;
  }

  toJSON() {
    return {
      type: MessageComponentTypes[this.type],
      components: this.components.map(c => c.toJSON()),
      accessory: this.accessory.toJSON(),
    };
  }
}

module.exports = SectionComponent;