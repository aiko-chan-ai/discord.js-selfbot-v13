'use strict';

const BaseMessageComponent = require('./BaseMessageComponent');
const { MessageComponentTypes, SeparatorSpacingSizes } = require('../util/Constants');

class SeparatorComponent extends BaseMessageComponent {
  /**
   * @property {SeparatorSpacingSizes} [spacing] Size of separator padding — SeparatorSpacingSizes.SMALL for small padding, SeparatorSpacingSizes.LARGE for large padding. Defaults to SeparatorSpacingSizes.SMALL
   * @property {Boolean} [divider] Whether a visual divider should be displayed in the component. Defaults to true
   */

  /**
   * @param {SeparatorComponent | APISeparatorComponent} [data={}] The data
   */
  constructor(data = {}) {
    super({ type: 'SEPARATOR' });

    this.setup(data);
  }

  setup(data) {
    super.setup(data);
    /**
     * Size of separator padding — SeparatorSpacingSizes.SMALL for small padding, SeparatorSpacingSizes.LARGE for large padding. Defaults to SeparatorSpacingSizes.SMALL
     * @type {SeparatorSpacingSizes}
     */
    this.spacing = data.spacing ?? SeparatorSpacingSizes.SMALL;

    /**
     * Whether a visual divider should be displayed in the component. Defaults to true
     * @type {Boolean}
     */
    this.divider = data.divider ?? true;
  }

  /**
   * @returns {APISeparatorComponent}
   */
  toJSON() {
    return {
      type: MessageComponentTypes[this.type],
      spacing: this.spacing,
      divider: this.divider,
    };
  }
}

module.exports = SeparatorComponent;
