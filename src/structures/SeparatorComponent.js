'use strict';

const BaseMessageComponent = require('./BaseMessageComponent');
const { MessageComponentTypes, SeparatorSpacingSizes } = require('../util/Constants');

class SeparatorComponent extends BaseMessageComponent {
  constructor(data = {}) {
    super({ type: 'SEPARATOR' });
    this.spacing = data.spacing ?? SeparatorSpacingSizes.SMALL;
    this.divider = data.divider ?? true;
  }

  toJSON() {
    return {
      type: MessageComponentTypes[this.type],
      spacing: this.spacing,
      divider: this.divider,
    };
  }
}

module.exports = SeparatorComponent;