'use strict';

const { setTimeout } = require('node:timers');
const { findBestMatch } = require('string-similarity');
const Base = require('./Base');
const MessagePayload = require('./MessagePayload');
const ApplicationCommandPermissionsManager = require('../managers/ApplicationCommandPermissionsManager');
const {
  ApplicationCommandOptionTypes,
  ApplicationCommandTypes,
  ChannelTypes,
  Events,
  InteractionTypes,
} = require('../util/Constants');
const Permissions = require('../util/Permissions');
const SnowflakeUtil = require('../util/SnowflakeUtil');
const { lazy, getAttachments, uploadFile } = require('../util/Util');
const Message = lazy(() => require('../structures/Message').Message);

/**
 * Represents an application command.
 * @extends {Base}
 */
class ApplicationCommand extends Base {
  constructor(client, data) {
    super(client);

    /**
     * The command's id
     * @type {Snowflake}
     */
    this.id = data.id;

    /**
     * The parent application's id
     * @type {Snowflake}
     */
    this.applicationId = data.application_id;

    /**
     * The manager for permissions of this command on its guild or arbitrary guilds when the command is global
     * @type {ApplicationCommandPermissionsManager}
     */
    this.permissions = new ApplicationCommandPermissionsManager(this, this.applicationId);

    /**
     * The type of this application command
     * @type {ApplicationCommandType}
     */
    this.type = ApplicationCommandTypes[data.type];

    this.user = client.users.cache.get(this.applicationId);

    this._patch(data);
  }

  /**
   * The guild this command is part of
   * @type {?Guild}
   * @readonly
   */
  get guild() {
    return this.client.guilds.resolve(this.guildId);
  }

  _patch(data) {
    if ('guild_id' in data) {
      /**
       * The guild's id this command is part of, this may be non-null when `guild` is `null` if the command
       * was fetched from the `ApplicationCommandManager`
       * @type {?Snowflake}
       */
      this.guildId = data.guild_id ?? null;
    }

    if ('name' in data) {
      /**
       * The name of this command
       * @type {string}
       */
      this.name = data.name;
    }

    if ('name_localizations' in data) {
      /**
       * The name localizations for this command
       * @type {?Object<Locale, string>}
       */
      this.nameLocalizations = data.name_localizations;
    } else {
      this.nameLocalizations ??= null;
    }

    if ('name_localized' in data) {
      /**
       * The localized name for this command
       * @type {?string}
       */
      this.nameLocalized = data.name_localized;
    } else {
      this.nameLocalized ??= null;
    }

    if ('description' in data) {
      /**
       * The description of this command
       * @type {string}
       */
      this.description = data.description;
    }

    if ('description_localizations' in data) {
      /**
       * The description localizations for this command
       * @type {?Object<Locale, string>}
       */
      this.descriptionLocalizations = data.description_localizations;
    } else {
      this.descriptionLocalizations ??= null;
    }

    if ('description_localized' in data) {
      /**
       * The localized description for this command
       * @type {?string}
       */
      this.descriptionLocalized = data.description_localized;
    } else {
      this.descriptionLocalized ??= null;
    }

    if ('options' in data) {
      /**
       * The options of this command
       * @type {ApplicationCommandOption[]}
       */
      this.options = data.options.map(o => this.constructor.transformOption(o, true));
    } else {
      this.options ??= [];
    }

    /* eslint-disable max-len */
    if ('default_permission' in data) {
      /**
       * Whether the command is enabled by default when the app is added to a guild
       * @type {boolean}
       * @deprecated Use {@link ApplicationCommand.defaultMemberPermissions} and {@link ApplicationCommand.dmPermission} instead.
       */
      this.defaultPermission = data.default_permission;
    }

    /* eslint-disable max-len */

    if ('default_member_permissions' in data) {
      /**
       * The default bitfield used to determine whether this command be used in a guild
       * @type {?Readonly<Permissions>}
       */
      this.defaultMemberPermissions = data.default_member_permissions
        ? new Permissions(BigInt(data.default_member_permissions)).freeze()
        : null;
    } else {
      this.defaultMemberPermissions ??= null;
    }

    if ('dm_permission' in data) {
      /**
       * Whether the command can be used in DMs
       * <info>This property is always `null` on guild commands</info>
       * @type {?boolean}
       */
      this.dmPermission = data.dm_permission;
    } else {
      this.dmPermission ??= null;
    }

    if ('version' in data) {
      /**
       * Autoincrementing version identifier updated during substantial record changes
       * @type {Snowflake}
       */
      this.version = data.version;
    }
  }

  /**
   * The timestamp the command was created at
   * @type {number}
   * @readonly
   */
  get createdTimestamp() {
    return SnowflakeUtil.timestampFrom(this.id);
  }

  /**
   * The time the command was created at
   * @type {Date}
   * @readonly
   */
  get createdAt() {
    return new Date(this.createdTimestamp);
  }

  /**
   * The manager that this command belongs to
   * @type {ApplicationCommandManager}
   * @readonly
   */
  get manager() {
    return (this.guild ?? this.client.application).commands;
  }

  /**
   * Data for creating or editing an application command.
   * @typedef {Object} ApplicationCommandData
   * @property {string} name The name of the command
   * @property {Object<Locale, string>} [nameLocalizations] The localizations for the command name
   * @property {string} description The description of the command
   * @property {Object<Locale, string>} [descriptionLocalizations] The localizations for the command description
   * @property {ApplicationCommandType} [type] The type of the command
   * @property {ApplicationCommandOptionData[]} [options] Options for the command
   * @property {boolean} [defaultPermission] Whether the command is enabled by default when the app is added to a guild
   * @property {?PermissionResolvable} [defaultMemberPermissions] The bitfield used to determine the default permissions
   * a member needs in order to run the command
   * @property {boolean} [dmPermission] Whether the command is enabled in DMs
   */

  /**
   * An option for an application command or subcommand.
   * <info>In addition to the listed properties, when used as a parameter,
   * API style `snake_case` properties can be used for compatibility with generators like `@discordjs/builders`.</info>
   * <warn>Note that providing a value for the `camelCase` counterpart for any `snake_case` property
   * will discard the provided `snake_case` property.</warn>
   * @typedef {Object} ApplicationCommandOptionData
   * @property {ApplicationCommandOptionType|number} type The type of the option
   * @property {string} name The name of the option
   * @property {Object<Locale, string>} [nameLocalizations] The name localizations for the option
   * @property {string} description The description of the option
   * @property {Object<Locale, string>} [descriptionLocalizations] The description localizations for the option
   * @property {boolean} [autocomplete] Whether the option is an autocomplete option
   * @property {boolean} [required] Whether the option is required
   * @property {ApplicationCommandOptionChoiceData[]} [choices] The choices of the option for the user to pick from
   * @property {ApplicationCommandOptionData[]} [options] Additional options if this option is a subcommand (group)
   * @property {ChannelType[]|number[]} [channelTypes] When the option type is channel,
   * the allowed types of channels that can be selected
   * @property {number} [minValue] The minimum value for an `INTEGER` or `NUMBER` option
   * @property {number} [maxValue] The maximum value for an `INTEGER` or `NUMBER` option
   * @property {number} [minLength] The minimum length for a `STRING` option
   * (maximum of `6000`)
   * @property {number} [maxLength] The maximum length for a `STRING` option
   * (maximum of `6000`)
   */

  /**
   * @typedef {Object} ApplicationCommandOptionChoiceData
   * @property {string} name The name of the choice
   * @property {Object<Locale, string>} [nameLocalizations] The localized names for this choice
   * @property {string|number} value The value of the choice
   */

  /**
   * Edits this application command.
   * @param {Partial<ApplicationCommandData>} data The data to update the command with
   * @returns {Promise<ApplicationCommand>}
   * @example
   * // Edit the description of this command
   * command.edit({
   *   description: 'New description',
   * })
   *   .then(console.log)
   *   .catch(console.error);
   */
  edit(data) {
    return this.manager.edit(this, data, this.guildId);
  }

  /**
   * Edits the name of this ApplicationCommand
   * @param {string} name The new name of the command
   * @returns {Promise<ApplicationCommand>}
   */
  setName(name) {
    return this.edit({ name });
  }

  /**
   * Edits the localized names of this ApplicationCommand
   * @param {Object<Locale, string>} nameLocalizations The new localized names for the command
   * @returns {Promise<ApplicationCommand>}
   * @example
   * // Edit the name localizations of this command
   * command.setLocalizedNames({
   *   'en-GB': 'test',
   *   'pt-BR': 'teste',
   * })
   *   .then(console.log)
   *   .catch(console.error)
   */
  setNameLocalizations(nameLocalizations) {
    return this.edit({ nameLocalizations });
  }

  /**
   * Edits the description of this ApplicationCommand
   * @param {string} description The new description of the command
   * @returns {Promise<ApplicationCommand>}
   */
  setDescription(description) {
    return this.edit({ description });
  }

  /**
   * Edits the localized descriptions of this ApplicationCommand
   * @param {Object<Locale, string>} descriptionLocalizations The new localized descriptions for the command
   * @returns {Promise<ApplicationCommand>}
   * @example
   * // Edit the description localizations of this command
   * command.setLocalizedDescriptions({
   *   'en-GB': 'A test command',
   *   'pt-BR': 'Um comando de teste',
   * })
   *   .then(console.log)
   *   .catch(console.error)
   */
  setDescriptionLocalizations(descriptionLocalizations) {
    return this.edit({ descriptionLocalizations });
  }

  /* eslint-disable max-len */
  /**
   * Edits the default permission of this ApplicationCommand
   * @param {boolean} [defaultPermission=true] The default permission for this command
   * @returns {Promise<ApplicationCommand>}
   * @deprecated Use {@link ApplicationCommand#setDefaultMemberPermissions} and {@link ApplicationCommand#setDMPermission} instead.
   */
  setDefaultPermission(defaultPermission = true) {
    return this.edit({ defaultPermission });
  }

  /* eslint-enable max-len */

  /**
   * Edits the default member permissions of this ApplicationCommand
   * @param {?PermissionResolvable} defaultMemberPermissions The default member permissions required to run this command
   * @returns {Promise<ApplicationCommand>}
   */
  setDefaultMemberPermissions(defaultMemberPermissions) {
    return this.edit({ defaultMemberPermissions });
  }

  /**
   * Edits the DM permission of this ApplicationCommand
   * @param {boolean} [dmPermission=true] Whether the command can be used in DMs
   * @returns {Promise<ApplicationCommand>}
   */
  setDMPermission(dmPermission = true) {
    return this.edit({ dmPermission });
  }

  /**
   * Edits the options of this ApplicationCommand
   * @param {ApplicationCommandOptionData[]} options The options to set for this command
   * @returns {Promise<ApplicationCommand>}
   */
  setOptions(options) {
    return this.edit({ options });
  }

  /**
   * Deletes this command.
   * @returns {Promise<ApplicationCommand>}
   * @example
   * // Delete this command
   * command.delete()
   *   .then(console.log)
   *   .catch(console.error);
   */
  delete() {
    return this.manager.delete(this, this.guildId);
  }

  /**
   * Whether this command equals another command. It compares all properties, so for most operations
   * it is advisable to just compare `command.id === command2.id` as it is much faster and is often
   * what most users need.
   * @param {ApplicationCommand|ApplicationCommandData|APIApplicationCommand} command The command to compare with
   * @param {boolean} [enforceOptionOrder=false] Whether to strictly check that options and choices are in the same
   * order in the array <info>The client may not always respect this ordering!</info>
   * @returns {boolean}
   */
  equals(command, enforceOptionOrder = false) {
    // If given an id, check if the id matches
    if (command.id && this.id !== command.id) return false;
    let defaultMemberPermissions = null;
    let dmPermission = command.dmPermission ?? command.dm_permission;

    if ('default_member_permissions' in command) {
      defaultMemberPermissions = command.default_member_permissions
        ? new Permissions(BigInt(command.default_member_permissions)).bitfield
        : null;
    }

    if ('defaultMemberPermissions' in command) {
      defaultMemberPermissions =
        command.defaultMemberPermissions !== null ? new Permissions(command.defaultMemberPermissions).bitfield : null;
    }
    // Check top level parameters
    const commandType = typeof command.type === 'string' ? command.type : ApplicationCommandTypes[command.type];
    if (
      command.name !== this.name ||
      ('description' in command && command.description !== this.description) ||
      ('version' in command && command.version !== this.version) ||
      ('autocomplete' in command && command.autocomplete !== this.autocomplete) ||
      (commandType && commandType !== this.type) ||
      defaultMemberPermissions !== (this.defaultMemberPermissions?.bitfield ?? null) ||
      (typeof dmPermission !== 'undefined' && dmPermission !== this.dmPermission) ||
      // Future proof for options being nullable
      // TODO: remove ?? 0 on each when nullable
      (command.options?.length ?? 0) !== (this.options?.length ?? 0) ||
      (command.defaultPermission ?? command.default_permission ?? true) !== this.defaultPermission
    ) {
      return false;
    }

    if (command.options) {
      return this.constructor.optionsEqual(this.options, command.options, enforceOptionOrder);
    }
    return true;
  }

  /**
   * Recursively checks that all options for an {@link ApplicationCommand} are equal to the provided options.
   * In most cases it is better to compare using {@link ApplicationCommand#equals}
   * @param {ApplicationCommandOptionData[]} existing The options on the existing command,
   * should be {@link ApplicationCommand#options}
   * @param {ApplicationCommandOptionData[]|APIApplicationCommandOption[]} options The options to compare against
   * @param {boolean} [enforceOptionOrder=false] Whether to strictly check that options and choices are in the same
   * order in the array <info>The client may not always respect this ordering!</info>
   * @returns {boolean}
   */
  static optionsEqual(existing, options, enforceOptionOrder = false) {
    if (existing.length !== options.length) return false;
    if (enforceOptionOrder) {
      return existing.every((option, index) => this._optionEquals(option, options[index], enforceOptionOrder));
    }
    const newOptions = new Map(options.map(option => [option.name, option]));
    for (const option of existing) {
      const foundOption = newOptions.get(option.name);
      if (!foundOption || !this._optionEquals(option, foundOption)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Checks that an option for an {@link ApplicationCommand} is equal to the provided option
   * In most cases it is better to compare using {@link ApplicationCommand#equals}
   * @param {ApplicationCommandOptionData} existing The option on the existing command,
   * should be from {@link ApplicationCommand#options}
   * @param {ApplicationCommandOptionData|APIApplicationCommandOption} option The option to compare against
   * @param {boolean} [enforceOptionOrder=false] Whether to strictly check that options or choices are in the same
   * order in their array <info>The client may not always respect this ordering!</info>
   * @returns {boolean}
   * @private
   */
  static _optionEquals(existing, option, enforceOptionOrder = false) {
    const optionType = typeof option.type === 'string' ? option.type : ApplicationCommandOptionTypes[option.type];
    if (
      option.name !== existing.name ||
      optionType !== existing.type ||
      option.description !== existing.description ||
      option.autocomplete !== existing.autocomplete ||
      (option.required ?? (['SUB_COMMAND', 'SUB_COMMAND_GROUP'].includes(optionType) ? undefined : false)) !==
        existing.required ||
      option.choices?.length !== existing.choices?.length ||
      option.options?.length !== existing.options?.length ||
      (option.channelTypes ?? option.channel_types)?.length !== existing.channelTypes?.length ||
      (option.minValue ?? option.min_value) !== existing.minValue ||
      (option.maxValue ?? option.max_value) !== existing.maxValue ||
      (option.minLength ?? option.min_length) !== existing.minLength ||
      (option.maxLength ?? option.max_length) !== existing.maxLength
    ) {
      return false;
    }

    if (existing.choices) {
      if (
        enforceOptionOrder &&
        !existing.choices.every(
          (choice, index) => choice.name === option.choices[index].name && choice.value === option.choices[index].value,
        )
      ) {
        return false;
      }
      if (!enforceOptionOrder) {
        const newChoices = new Map(option.choices.map(choice => [choice.name, choice]));
        for (const choice of existing.choices) {
          const foundChoice = newChoices.get(choice.name);
          if (!foundChoice || foundChoice.value !== choice.value) return false;
        }
      }
    }

    if (existing.channelTypes) {
      const newTypes = (option.channelTypes ?? option.channel_types).map(type =>
        typeof type === 'number' ? ChannelTypes[type] : type,
      );
      for (const type of existing.channelTypes) {
        if (!newTypes.includes(type)) return false;
      }
    }

    if (existing.options) {
      return this.optionsEqual(existing.options, option.options, enforceOptionOrder);
    }
    return true;
  }

  /**
   * An option for an application command or subcommand.
   * @typedef {Object} ApplicationCommandOption
   * @property {ApplicationCommandOptionType} type The type of the option
   * @property {string} name The name of the option
   * @property {Object<string, string>} [nameLocalizations] The localizations for the option name
   * @property {string} [nameLocalized] The localized name for this option
   * @property {string} description The description of the option
   * @property {Object<string, string>} [descriptionLocalizations] The localizations for the option description
   * @property {string} [descriptionLocalized] The localized description for this option
   * @property {boolean} [required] Whether the option is required
   * @property {boolean} [autocomplete] Whether the option is an autocomplete option
   * @property {ApplicationCommandOptionChoice[]} [choices] The choices of the option for the user to pick from
   * @property {ApplicationCommandOption[]} [options] Additional options if this option is a subcommand (group)
   * @property {ChannelType[]} [channelTypes] When the option type is channel,
   * the allowed types of channels that can be selected
   * @property {number} [minValue] The minimum value for an `INTEGER` or `NUMBER` option
   * @property {number} [maxValue] The maximum value for an `INTEGER` or `NUMBER` option
   * @property {number} [minLength] The minimum length for a `STRING` option
   * (maximum of `6000`)
   * @property {number} [maxLength] The maximum length for a `STRING` option
   * (maximum of `6000`)
   */

  /**
   * A choice for an application command option.
   * @typedef {Object} ApplicationCommandOptionChoice
   * @property {string} name The name of the choice
   * @property {?string} nameLocalized The localized name of the choice in the provided locale, if any
   * @property {?Object<string, string>} [nameLocalizations] The localized names for this choice
   * @property {string|number} value The value of the choice
   */

  /**
   * Transforms an {@link ApplicationCommandOptionData} object into something that can be used with the API.
   * @param {ApplicationCommandOptionData|ApplicationCommandOption} option The option to transform
   * @param {boolean} [received] Whether this option has been received from Discord
   * @returns {APIApplicationCommandOption}
   * @private
   */
  static transformOption(option, received) {
    const stringType = typeof option.type === 'string' ? option.type : ApplicationCommandOptionTypes[option.type];
    const channelTypesKey = received ? 'channelTypes' : 'channel_types';
    const minValueKey = received ? 'minValue' : 'min_value';
    const maxValueKey = received ? 'maxValue' : 'max_value';
    const minLengthKey = received ? 'minLength' : 'min_length';
    const maxLengthKey = received ? 'maxLength' : 'max_length';
    const nameLocalizationsKey = received ? 'nameLocalizations' : 'name_localizations';
    const nameLocalizedKey = received ? 'nameLocalized' : 'name_localized';
    const descriptionLocalizationsKey = received ? 'descriptionLocalizations' : 'description_localizations';
    const descriptionLocalizedKey = received ? 'descriptionLocalized' : 'description_localized';
    return {
      type: typeof option.type === 'number' && !received ? option.type : ApplicationCommandOptionTypes[option.type],
      name: option.name,
      [nameLocalizationsKey]: option.nameLocalizations ?? option.name_localizations,
      [nameLocalizedKey]: option.nameLocalized ?? option.name_localized,
      description: option.description,
      [descriptionLocalizationsKey]: option.descriptionLocalizations ?? option.description_localizations,
      [descriptionLocalizedKey]: option.descriptionLocalized ?? option.description_localized,
      required:
        option.required ?? (stringType === 'SUB_COMMAND' || stringType === 'SUB_COMMAND_GROUP' ? undefined : false),
      autocomplete: option.autocomplete,
      choices: option.choices?.map(choice => ({
        name: choice.name,
        [nameLocalizedKey]: choice.nameLocalized ?? choice.name_localized,
        [nameLocalizationsKey]: choice.nameLocalizations ?? choice.name_localizations,
        value: choice.value,
      })),
      options: option.options?.map(o => this.transformOption(o, received)),
      [channelTypesKey]: received
        ? option.channel_types?.map(type => ChannelTypes[type])
        : option.channelTypes?.map(type => (typeof type === 'string' ? ChannelTypes[type] : type)) ??
          // When transforming to API data, accept API data
          option.channel_types,
      [minValueKey]: option.minValue ?? option.min_value,
      [maxValueKey]: option.maxValue ?? option.max_value,
      [minLengthKey]: option.minLength ?? option.min_length,
      [maxLengthKey]: option.maxLength ?? option.max_length,
    };
  }
  /**
   * Send Slash command to channel
   * @param {Message} message Discord Message
   * @param {Array<string>} subCommandArray SubCommand Array
   * @param {Array<any>} options The options to Slash Command
   * @returns {Promise<InteractionResponse>}
   */
  // eslint-disable-next-line consistent-return
  async sendSlashCommand(message, subCommandArray = [], options = []) {
    // Todo: Refactor [Done]
    const buildError = (type, value, array, msg) =>
      new Error(`Invalid ${type}: ${value} ${msg}\nList of ${type}:\n${array}`);
    // Check Options
    if (!(message instanceof Message())) {
      throw new TypeError('The message must be a Discord.Message');
    }
    if (!Array.isArray(options)) {
      throw new TypeError('The options must be an array of strings');
    }
    if (this.type !== 'CHAT_INPUT') throw new Error('This command is not a chat input [/]');
    const optionFormat = [];
    const attachments = [];
    const attachmentsBuffer = [];
    const parseChoices = (list_choices, value) => {
      if (value !== undefined) {
        if (Array.isArray(list_choices) && list_choices.length) {
          const choice = list_choices.find(c => c.name === value) || list_choices.find(c => c.value === value);
          if (choice) {
            return choice.value;
          }
          throw buildError(
            'choice',
            value,
            list_choices.map((c, i) => `  #${i + 1} Name: ${c.name} Value: ${c.value}`).join('\n'),
            'is not a valid choice for this option',
          );
        } else {
          return value;
        }
      } else {
        return undefined;
      }
    };
    const parseOption = async (optionCommand, value) => {
      const data = {
        type: ApplicationCommandOptionTypes[optionCommand.type],
        name: optionCommand.name,
      };
      if (value !== undefined) {
        value = parseChoices(optionCommand.choices, value);
        switch (optionCommand.type) {
          case 'BOOLEAN': {
            data.value = Boolean(value);
            break;
          }
          case 'INTEGER': {
            data.value = Number(value);
            break;
          }
          case 'ATTACHMENT': {
            data.value = await addDataFromAttachment(value, this.client);
            break;
          }
          case 'SUB_COMMAND_GROUP': {
            break;
          }
          default: {
            if (optionCommand.autocomplete) {
              let optionsBuild;
              switch (subCommandArray.length) {
                case 0: {
                  optionsBuild = [
                    ...optionFormat,
                    {
                      type: ApplicationCommandOptionTypes[optionCommand.type],
                      name: optionCommand.name,
                      value,
                      focused: true,
                    },
                  ];
                  break;
                }
                case 1: {
                  const subCommand = this.options.find(o => o.name == subCommandArray[0] && o.type == 'SUB_COMMAND');
                  optionsBuild = [
                    {
                      type: ApplicationCommandOptionTypes[subCommand.type],
                      name: subCommand.name,
                      options: [
                        ...optionFormat,
                        {
                          type: ApplicationCommandOptionTypes[optionCommand.type],
                          name: optionCommand.name,
                          value,
                          focused: true,
                        },
                      ],
                    },
                  ];
                  break;
                }
                case 2: {
                  const subGroup = this.options.find(
                    o => o.name == subCommandArray[0] && o.type == 'SUB_COMMAND_GROUP',
                  );
                  const subCommand = subGroup.options.find(
                    o => o.name == subCommandArray[1] && o.type == 'SUB_COMMAND',
                  );
                  optionsBuild = [
                    {
                      type: ApplicationCommandOptionTypes[subGroup.type],
                      name: subGroup.name,
                      options: [
                        {
                          type: ApplicationCommandOptionTypes[subCommand.type],
                          name: subCommand.name,
                          options: [
                            ...optionFormat,
                            {
                              type: ApplicationCommandOptionTypes[optionCommand.type],
                              name: optionCommand.name,
                              value,
                              focused: true,
                            },
                          ],
                        },
                      ],
                    },
                  ];
                  break;
                }
              }
              const autoValue = await getAutoResponse(optionsBuild, value);
              data.value = autoValue;
            } else {
              data.value = value;
            }
          }
        }
        optionFormat.push(data);
      }
      return optionFormat;
    };
    const parseSubCommand = async (subCommandName, options, subGroup) => {
      const options_sub = subGroup ? subGroup.options : this.options;
      const subCommand = options_sub.find(
        o => (o.name == subCommandName || o.nameLocalized == subCommandName) && o.type == 'SUB_COMMAND',
      );
      if (!subCommand) {
        throw buildError(
          'SubCommand',
          subCommandName,
          options_sub.map((o, i) => `  #${i + 1} Name: ${o.name}`).join('\n'),
          'is not a valid sub command',
        );
      }
      const valueRequired = subCommand.options?.filter(o => o.required).length || 0;
      for (let i = 0; i < options.length; i++) {
        const optionInput = subCommand.options[i];
        const value = options[i];
        await parseOption(optionInput, value);
      }
      if (valueRequired > options.length) {
        throw new Error(`Value required missing\nDebug:
        Required: ${valueRequired} - Options: ${optionFormat.length}`);
      }
      return {
        type: ApplicationCommandOptionTypes[subCommand.type],
        name: subCommand.name,
        options: optionFormat,
      };
    };
    const parseSubGroupCommand = async (subGroupName, subName) => {
      const subGroup = this.options.find(
        o => (o.name == subGroupName || o.nameLocalized == subGroupName) && o.type == 'SUB_COMMAND_GROUP',
      );
      if (!subGroup) {
        throw buildError(
          'SubGroupCommand',
          subGroupName,
          this.options.map((o, i) => `  #${i + 1} Name: ${o.name}`).join('\n'),
          'is not a valid sub group command',
        );
      }
      const data = await parseSubCommand(subName, options, subGroup);
      return {
        type: ApplicationCommandOptionTypes[subGroup.type],
        name: subGroup.name,
        options: [data],
      };
    };
    async function addDataFromAttachment(data, client) {
      const data_ = await MessagePayload.resolveFile(data);
      if (!data_.file) {
        throw new TypeError(
          'The attachment data must be a BufferResolvable or Stream or FileOptions of MessageAttachment',
        );
      }
      if (client.options.usingNewAttachmentAPI === true) {
        const attachments_ = await getAttachments(client, message.channelId, data_);
        await uploadFile(data_.file, attachments_[0].upload_url);
        const id = attachments.length;
        attachments.push({
          id: id,
          filename: data_.name,
          uploaded_filename: attachments_[0].upload_filename,
        });
        return id;
      } else {
        const id = attachments.length;
        attachments.push({
          id: id,
          filename: data_.name,
        });
        attachmentsBuffer.push(data_);
        return id;
      }
    }
    const getDataPost = (dataAdd = [], nonce, autocomplete = false) => {
      if (!Array.isArray(dataAdd) && typeof dataAdd == 'object') {
        dataAdd = [dataAdd];
      }
      const data = {
        type: autocomplete ? InteractionTypes.APPLICATION_COMMAND_AUTOCOMPLETE : InteractionTypes.APPLICATION_COMMAND,
        application_id: this.applicationId,
        guild_id: message.guildId,
        channel_id: message.channelId,
        session_id: this.client.sessionId,
        data: {
          version: this.version,
          id: this.id,
          name: this.name,
          type: ApplicationCommandTypes[this.type],
          options: dataAdd,
          attachments: attachments,
        },
        nonce,
      };
      if (this.guildId) {
        data.data.guild_id = message.guildId;
      }
      return data;
    };
    const getAutoResponse = async (sendData, value) => {
      let nonce = SnowflakeUtil.generate();
      const data = getDataPost(sendData, nonce, true);
      await this.client.api.interactions.post({
        data,
        files: attachmentsBuffer,
      });
      return new Promise(resolve => {
        const handler = data => {
          timeout.refresh();
          if (data.nonce !== nonce) return;
          clearTimeout(timeout);
          this.client.removeListener(Events.APPLICATION_COMMAND_AUTOCOMPLETE_RESPONSE, handler);
          this.client.decrementMaxListeners();
          if (data.choices.length > 1) {
            // Find best match name
            const bestMatch = findBestMatch(
              value,
              data.choices.map(c => c.name),
            );
            const result = data.choices.find(c => c.name == bestMatch.bestMatch.target);
            resolve(result.value);
          } else {
            resolve(value);
          }
        };
        const timeout = setTimeout(() => {
          this.client.removeListener(Events.APPLICATION_COMMAND_AUTOCOMPLETE_RESPONSE, handler);
          this.client.decrementMaxListeners();
          resolve(value);
        }, this.client.options.interactionTimeout).unref();
        this.client.incrementMaxListeners();
        this.client.on(Events.APPLICATION_COMMAND_AUTOCOMPLETE_RESPONSE, handler);
      });
    };
    const sendData = async (optionsData = []) => {
      let nonce = SnowflakeUtil.generate();
      const data = getDataPost(optionsData, nonce);
      await this.client.api.interactions.post({
        data,
        useFormDataPayloadJSON: true,
        files: attachmentsBuffer,
      });
      this.client._interactionCache.set(nonce, {
        channelId: message.channelId,
        guildId: message.guildId,
        metadata: data,
      });
      return new Promise((resolve, reject) => {
        const handler = data => {
          timeout.refresh();
          if (data.metadata?.nonce !== nonce) return;
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
              cause: data,
            }),
          );
        }, this.client.options.interactionTimeout).unref();
        this.client.incrementMaxListeners();
        this.client.on('interactionResponse', handler);
      });
    };
    // SubCommandArray length max 2
    // length = 0 => no sub command
    // length = 1 => sub command
    // length = 2 => sub command group + sub command
    switch (subCommandArray.length) {
      case 0: {
        const valueRequired = this.options?.filter(o => o.required).length || 0;
        for (let i = 0; i < options.length; i++) {
          const optionInput = this.options[i];
          const value = options[i];
          await parseOption(optionInput, value);
        }
        if (valueRequired > options.length) {
          throw new Error(`Value required missing\nDebug:
        Required: ${valueRequired} - Options: ${optionFormat.length}`);
        }
        return sendData(optionFormat);
      }
      case 1: {
        const optionsData = await parseSubCommand(subCommandArray[0], options);
        return sendData(optionsData);
      }
      case 2: {
        const optionsData = await parseSubGroupCommand(subCommandArray[0], subCommandArray[1], options);
        return sendData(optionsData);
      }
    }
  }
  /**
   * Message Context Menu
   * @param {Message} message Discord Message
   * @returns {Promise<InteractionResponse>}
   */
  async sendContextMenu(message) {
    if (!(message instanceof Message())) {
      throw new TypeError('The message must be a Discord.Message');
    }
    if (this.type == 'CHAT_INPUT') return false;
    const nonce = SnowflakeUtil.generate();
    const data = {
      type: InteractionTypes.APPLICATION_COMMAND,
      application_id: this.applicationId,
      guild_id: message.guildId,
      channel_id: message.channelId,
      session_id: this.client.sessionId,
      data: {
        version: this.version,
        id: this.id,
        name: this.name,
        type: ApplicationCommandTypes[this.type],
        target_id: ApplicationCommandTypes[this.type] == 1 ? message.author.id : message.id,
      },
      nonce,
    };
    if (this.guildId) {
      data.data.guild_id = message.guildId;
    }
    await this.client.api.interactions.post({
      data,
      useFormDataPayloadJSON: true,
    });
    this.client._interactionCache.set(nonce, {
      channelId: message.channelId,
      guildId: message.guildId,
      metadata: data,
    });
    return new Promise((resolve, reject) => {
      const handler = data => {
        timeout.refresh();
        if (data.metadata?.nonce !== nonce) return;
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
            cause: data,
          }),
        );
      }, this.client.options.interactionTimeout).unref();
      this.client.incrementMaxListeners();
      this.client.on('interactionResponse', handler);
    });
  }
}

module.exports = ApplicationCommand;

/* eslint-disable max-len */
/**
 * @external APIApplicationCommand
 * @see {@link https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-structure}
 */

/**
 * @external APIApplicationCommandOption
 * @see {@link https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-structure}
 */
