'use strict';

const CachedManager = require('./CachedManager');
const { default: Collection } = require('@discordjs/collection');
const { Error } = require('../errors/DJSError');
/**
 * Manages API methods for users and stores their cache.
 * @extends {CachedManager}
 */
const localeObject = {
	DANISH: 'da',
	GERMAN: 'de',
	ENGLISH_UK: 'en-GB',
	ENGLISH_US: 'en-US',
	SPANISH: 'es-ES',
	FRENCH: 'fr',
	CROATIAN: 'hr',
	ITALIAN: 'it',
	LITHUANIAN: 'lt',
	HUNGARIAN: 'hu',
	DUTCH: 'nl',
	NORWEGIAN: 'no',
	POLISH: 'pl',
	BRAZILIAN_PORTUGUESE: 'pt-BR',
	ROMANIA_ROMANIAN: 'ro',
	FINNISH: 'fi',
	SWEDISH: 'sv-SE',
	VIETNAMESE: 'vi',
	TURKISH: 'tr',
	CZECH: 'cs',
	GREEK: 'el',
	BULGARIAN: 'bg',
	RUSSIAN: 'ru',
	UKRAINIAN: 'uk',
	HINDI: 'hi',
	THAI: 'th',
	CHINA_CHINESE: 'zh-CN',
	JAPANESE: 'ja',
	TAIWAN_CHINESE: 'zh-TW',
	KOREAN: 'ko',
};
class ClientUserSettingManager extends CachedManager {
	constructor(client, iterable) {
		super(client);
		// Raw data
		this.rawSetting = {};
		// Language
		this.locale = null;
		// Setting => ACTIVITY SETTINGS => Activity Status => Display current activity as a status message
		this.showCurrentGame = null;
		// Setting => APP SETTINGS => Accessibility => Automatically play GIFs when Discord is focused.
		this.autoplayGIF = null;
		// Setting => APP SETTINGS => Appearance => Message Display => Compact Mode [OK]
		this.compactMode = null;
		// Setting => APP SETTINGS => Text & Images => Emoji => Convert Emoticons
		this.convertEmoticons = null;
		// Setting => APP SETTINGS => Accessibility => Text-to-speech => Allow playback
		this.allowTTS = null;
		// Setting => APP SETTINGS => Appearance => Theme [OK]
		this.theme = '';
		// Setting => APP SETTINGS => Accessibility => Play Animated Emojis
		this.animatedEmojis = null;
		// Setting => APP SETTINGS => Text & Images => Emoji => Show emoji reactions
		this.showEmojiReactions = null;
		// Custom Stauts [It's not working now]
		this.customStatus = null;
		// Guild folder and position
		this.guildMetadata = new Collection();
	}
	_patch(data) {
		this.rawSetting = data;
		if ('locale' in data) {
			this.locale = data.locale;
		}
		if ('show_current_game' in data) {
			this.showCurrentGame = data.show_current_game;
		}
		if ('gif_auto_play' in data) {
			this.autoplayGIF = data.gif_auto_play;
		}
		if ('message_display_compact' in data) {
			this.compactMode = data.message_display_compact;
		}
		if ('convert_emoticons' in data) {
			this.convertEmoticons = data.convert_emoticons;
		}
		if ('enable_tts_command' in data) {
			this.allowTTS = data.enable_tts_command;
		}
		if ('theme' in data) {
			this.theme = data.theme;
		}
		if ('animate_emoji' in data) {
			this.animatedEmojis = data.animate_emoji;
		}
		if ('render_reactions' in data) {
			this.showEmojiReactions = data.render_reactions;
		}
		if ('custom_status' in data) {
			this.customStatus = data.custom_status;
			this.customStatus.status = data.status;
		}
		if ('guild_folders' in data) {
			const data_ = data.guild_positions.map((guildId, i) => {
				// Find folder
				const folderIndex = data.guild_folders.findIndex((obj) =>
					obj.guild_ids.includes(guildId),
				);
				const metadata = {
					guildId: guildId,
					guildIndex: i,
					folderId: data.guild_folders[folderIndex]?.id,
					folderIndex,
					folderName: data.guild_folders[folderIndex]?.name,
					folderColor: data.guild_folders[folderIndex]?.color,
					folderGuilds: data.guild_folders[folderIndex]?.guild_ids,
				};
				return [guildId, metadata];
			});
			this.guildMetadata = new Collection(data_);
		}
	}
	async fetch() {
		if (this.client.bot) throw new Error('INVALID_BOT_METHOD');
		try {
			const data = await this.client.api.users('@me').settings.get();
			this._patch(data);
			return this;
		} catch (e) {
			throw e;
		}
	}
	/**
	 * Edit data
	 * @param {Object} data Data to edit
	 * @private
	 */
	async edit(data) {
		if (this.client.bot) throw new Error('INVALID_BOT_METHOD');
		try {
			const res = await this.client.api.users('@me').settings.patch({ data });
			this._patch(res);
			return this;
		} catch (e) {
			throw e;
		}
	}
	/**
	 * Set compact mode
	 * @param {Boolean | null} value Compact mode enable or disable
	 * @returns {Boolean}
	 */
	async setDisplayCompactMode(value) {
		if (this.client.bot) throw new Error('INVALID_BOT_METHOD');
		if (!value) value = !this.compactMode;
		if (value !== this.compactMode) {
			await this.edit({ message_display_compact: value });
		}
		return this.compactMode;
	}
	/**
	 * Discord Theme
	 * @param {null |dark |light} value Theme to set
	 * @returns {theme}
	 */
	async setTheme(value) {
		if (this.client.bot) throw new Error('INVALID_BOT_METHOD');
		const validValues = ['dark', 'light'];
		if (!validValues.includes(value)) {
			value == validValues[0]
				? (value = validValues[1])
				: (value = validValues[0]);
		}
		if (value !== this.theme) {
			await this.edit({ theme: value });
		}
		return this.theme;
	}
	/**
	 * Locale Setting, must be one of:
	 * * `DANISH`
	 * * `GERMAN`
	 * * `ENGLISH_UK`
	 * * `ENGLISH_US`
	 * * `SPANISH`
	 * * `FRENCH`
	 * * `CROATIAN`
	 * * `ITALIAN`
	 * * `LITHUANIAN`
	 * * `HUNGARIAN`
	 * * `DUTCH`
	 * * `NORWEGIAN`
	 * * `POLISH`
	 * * `BRAZILIAN_PORTUGUESE`
	 * * `ROMANIA_ROMANIAN`
	 * * `FINNISH`
	 * * `SWEDISH`
	 * * `VIETNAMESE`
	 * * `TURKISH`
	 * * `CZECH`
	 * * `GREEK`
	 * * `BULGARIAN`
	 * * `RUSSIAN`
	 * * `UKRAINIAN`
	 * * `HINDI`
	 * * `THAI`
	 * * `CHINA_CHINESE`
	 * * `JAPANESE`
	 * * `TAIWAN_CHINESE`
	 * * `KOREAN`
	 * @typedef {string} LocaleStrings
	 */
	/**
	 *
	 * @param {LocaleStrings} value
	 * @returns {locale}
	 */
	async setLocale(value) {
		if (this.client.bot) throw new Error('INVALID_BOT_METHOD');
		if (!localeObject[value]) throw new Error('INVALID_LOCALE');
		if (localeObject[value] !== this.locale) {
			await this.edit({ locale: localeObject[value] });
		}
		return this.locale;
	}
}

module.exports = ClientUserSettingManager;
