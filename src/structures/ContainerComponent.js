'use strict';

const BaseMessageComponent = require('./BaseMessageComponent');
const { MessageComponentTypes } = require('../util/Constants');

class ContainerComponent extends BaseMessageComponent {
  /**
   * @typedef {MessageActionRow|TextDisplayComponent|SectionComponent|MediaGalleryComponent|SeparatorComponent|FileComponent} ContainerComponents
   * @property {ContainerComponents[]} [components] Components of the type action row, text display, section, media gallery, separator, or file
   * @property {Number} [accent_color] Color for the accent on the container as RGB from 0x000000 to 0xFFFFFF
   * @property {Boolean} [spoiler] Whether the container should be a spoiler (or blurred out). Defaults to false.
   */

  /**
   * @param {ContainerComponent | APIContainerComponent} [data={}] The data
   */
  constructor(data = {}) {
    super({ type: 'CONTAINER' });

    this.setup(data);
  }

  setup(data) {
    super.setup(data);
    /**
     * Components of the type action row, text display, section, media gallery, separator, or file
     * @type {ContainerComponents[]}
     */
    this.components = data.components?.map(c => BaseMessageComponent.create(c)) ?? [];

    /**
     * Color for the accent on the container as RGB from 0x000000 to 0xFFFFFF
     * @type {Number}
     */
    this.accentColor = data.accent_color ?? null;

    /**
     * Whether the container should be a spoiler (or blurred out). Defaults to false.
     * @type {Boolean}
     */
    this.spoiler = data.spoiler ?? false;
  }

  /**
   * The hex accent color of this container
   * @type {?string}
   * @readonly
   */
  get hexAccentColor() {
    return typeof this.accentColor === 'number'
      ? `#${this.accentColor.toString(16).padStart(6, '0')}`
      : this.accentColor ?? null;
  }

  /**
   * @returns {APIContainerComponent}
   */
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
