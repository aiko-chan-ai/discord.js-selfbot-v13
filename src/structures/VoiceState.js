'use strict';

const Base = require('./Base');
const { Error, TypeError } = require('../errors');

/**
 * Represents the voice state for a Guild Member.
 * @extends {Base}
 */
class VoiceState extends Base {
  constructor(guild, data) {
    super(guild.client);
    /**
     * The guild of this voice state
     * @type {Guild}
     */
    this.guild = guild;
    /**
     * The id of the member of this voice state
     * @type {Snowflake}
     */
    this.id = data.user_id;
    this._patch(data);
  }

  _patch(data) {
    if ('deaf' in data) {
      /**
       * Whether this member is deafened server-wide
       * @type {?boolean}
       */
      this.serverDeaf = data.deaf;
    } else {
      this.serverDeaf ??= null;
    }

    if ('mute' in data) {
      /**
       * Whether this member is muted server-wide
       * @type {?boolean}
       */
      this.serverMute = data.mute;
    } else {
      this.serverMute ??= null;
    }

    if ('self_deaf' in data) {
      /**
       * Whether this member is self-deafened
       * @type {?boolean}
       */
      this.selfDeaf = data.self_deaf;
    } else {
      this.selfDeaf ??= null;
    }

    if ('self_mute' in data) {
      /**
       * Whether this member is self-muted
       * @type {?boolean}
       */
      this.selfMute = data.self_mute;
    } else {
      this.selfMute ??= null;
    }

    if ('self_video' in data) {
      /**
       * Whether this member's camera is enabled
       * @type {?boolean}
       */
      this.selfVideo = data.self_video;
    } else {
      this.selfVideo ??= null;
    }

    if ('session_id' in data) {
      /**
       * The session id for this member's connection
       * @type {?string}
       */
      this.sessionId = data.session_id;
    } else {
      this.sessionId ??= null;
    }

    // The self_stream is property is omitted if false, check for another property
    // here to avoid incorrectly clearing this when partial data is specified
    if ('self_video' in data) {
      /**
       * Whether this member is streaming using "Screen Share"
       * @type {boolean}
       */
      this.streaming = data.self_stream ?? false;
    } else {
      this.streaming ??= null;
    }

    if ('channel_id' in data) {
      /**
       * The {@link VoiceChannel} or {@link StageChannel} id the member is in
       * @type {?Snowflake}
       */
      this.channelId = data.channel_id;
    } else {
      this.channelId ??= null;
    }

    if ('suppress' in data) {
      /**
       * Whether this member is suppressed from speaking. This property is specific to stage channels only.
       * @type {boolean}
       */
      this.suppress = data.suppress;
    }

    if ('request_to_speak_timestamp' in data) {
      /**
       * The time at which the member requested to speak. This property is specific to stage channels only.
       * @type {?number}
       */
      this.requestToSpeakTimestamp = data.request_to_speak_timestamp && Date.parse(data.request_to_speak_timestamp);
    } else {
      this.requestToSpeakTimestamp ??= null;
    }

    return this;
  }

  /**
   * The member that this voice state belongs to
   * @type {?GuildMember}
   * @readonly
   */
  get member() {
    if (!this.guild?.id) return null;
    return this.guild.members.cache.get(this.id) ?? null;
  }

  /**
   * The user that this voice state belongs to
   * @type {?User}
   * @readonly
   */
  get user() {
    return this.guild.client.users.cache.get(this.id) ?? null;
  }

  /**
   * The channel that the member is connected to
   * @type {?(VoiceChannel|StageChannel|DMChannel|GroupDMChannel)}
   * @readonly
   */
  get channel() {
    return (this.guild?.id ? this.guild : this.client)?.channels?.cache.get(this.channelId) ?? null;
  }

  /**
   * Whether this member is either self-deafened or server-deafened
   * @type {?boolean}
   * @readonly
   */
  get deaf() {
    return this.serverDeaf || this.selfDeaf;
  }

  /**
   * Whether this member is either self-muted or server-muted
   * @type {?boolean}
   * @readonly
   */
  get mute() {
    return this.serverMute || this.selfMute;
  }

  /**
   * Mutes/unmutes the member of this voice state.
   * @param {boolean} [mute=true] Whether or not the member should be muted
   * @param {string} [reason] Reason for muting or unmuting
   * @returns {Promise<GuildMember>}
   */
  setMute(mute = true, reason) {
    if (!this.guild?.id) return null;
    return this.guild.members.edit(this.id, { mute }, reason);
  }

  /**
   * Deafens/undeafens the member of this voice state.
   * @param {boolean} [deaf=true] Whether or not the member should be deafened
   * @param {string} [reason] Reason for deafening or undeafening
   * @returns {Promise<GuildMember>}
   */
  setDeaf(deaf = true, reason) {
    if (!this.guild?.id) return null;
    return this.guild.members.edit(this.id, { deaf }, reason);
  }

  /**
   * Disconnects the member from the channel.
   * @param {string} [reason] Reason for disconnecting the member from the channel
   * @returns {Promise<GuildMember>}
   */
  disconnect(reason) {
    return this.setChannel(null, reason);
  }

  /**
   * Moves the member to a different channel, or disconnects them from the one they're in.
   * @param {GuildVoiceChannelResolvable|null} channel Channel to move the member to, or `null` if you want to
   * disconnect them from voice.
   * @param {string} [reason] Reason for moving member to another channel or disconnecting
   * @returns {Promise<GuildMember>}
   */
  setChannel(channel, reason) {
    if (!this.guild?.id) return null;
    return this.guild.members.edit(this.id, { channel }, reason);
  }

  /**
   * Toggles the request to speak in the channel.
   * Only applicable for stage channels and for the client's own voice state.
   * @param {boolean} [request=true] Whether or not the client is requesting to become a speaker.
   * @example
   * // Making the client request to speak in a stage channel (raise its hand)
   * guild.members.me.voice.setRequestToSpeak(true);
   * @example
   * // Making the client cancel a request to speak
   * guild.members.me.voice.setRequestToSpeak(false);
   * @returns {Promise<void>}
   */
  async setRequestToSpeak(request = true) {
    if (this.channel?.type !== 'GUILD_STAGE_VOICE') throw new Error('VOICE_NOT_STAGE_CHANNEL');

    if (this.client.user.id !== this.id) throw new Error('VOICE_STATE_NOT_OWN');

    await this.client.api.guilds(this.guild.id, 'voice-states', '@me').patch({
      data: {
        channel_id: this.channelId,
        request_to_speak_timestamp: request ? new Date().toISOString() : null,
      },
    });
  }

  /**
   * Suppress/unsuppress the user. Only applicable for stage channels.
   * @param {boolean} [suppressed=true] Whether or not the user should be suppressed.
   * @example
   * // Making the client a speaker
   * guild.members.me.voice.setSuppressed(false);
   * @example
   * // Making the client an audience member
   * guild.members.me.voice.setSuppressed(true);
   * @example
   * // Inviting another user to speak
   * voiceState.setSuppressed(false);
   * @example
   * // Moving another user to the audience, or cancelling their invite to speak
   * voiceState.setSuppressed(true);
   * @returns {Promise<void>}
   */
  async setSuppressed(suppressed = true) {
    if (typeof suppressed !== 'boolean') throw new TypeError('VOICE_STATE_INVALID_TYPE', 'suppressed');

    if (this.channel?.type !== 'GUILD_STAGE_VOICE') throw new Error('VOICE_NOT_STAGE_CHANNEL');

    const target = this.client.user.id === this.id ? '@me' : this.id;

    await this.client.api.guilds(this.guild.id, 'voice-states', target).patch({
      data: {
        channel_id: this.channelId,
        suppress: suppressed,
        request_to_speak_timestamp: null,
      },
    });
  }

  /**
   * Sets the status of the voice channel
   * @param {string} [status=""] The message to set the channel status to
   * @example
   * // Setting the status to something
   * guild.members.me.voice.setStatus("something")
   * @example
   * // Removing the status
   * guild.members.me.voice.setStatus()
   * @returns {Promise<void>}
   */
  setStatus(status = '') {
    // PUT https://discord.com/api/v9/channels/:id/voice-status
    return this.client.api.channels(this.channel.id, 'voice-status').put({
      data: {
        status,
      },
    });
  }

  /**
   * Get URL Image of the user's streaming video (NOT STREAMING !!!)
   * @returns {Promise<string>} URL Image of the user's streaming video
   */
  async getPreview() {
    if (!this.streaming) throw new Error('USER_NOT_STREAMING');
    // URL: https://discord.com/api/v9/streams/guild:guildid:voicechannelid:userid/preview
    // URL: https://discord.com/api/v9/streams/call:channelId:userId/preview
    const streamKey = this.guild?.id
      ? `guild:${this.guild.id}:${this.channelId}:${this.id}`
      : `call:${this.channelId}:${this.id}`;
    const data = await this.client.api.streams[encodeURIComponent(streamKey)].preview.get();
    return data.url;
  }

  /**
   * Post Preview Image to the client user's streaming video
   * @param {string} base64Image Base64 URI (data:image/jpeg;base64,data)
   * @returns {Promise<void>}
   */
  postPreview(base64Image) {
    if (!this.client.user.id === this.id || !this.streaming) throw new Error('USER_NOT_STREAMING');
    // URL: https://discord.com/api/v9/streams/guild:guildid:voicechannelid:userid/preview
    // URL: https://discord.com/api/v9/streams/call:channelId:userId/preview
    const streamKey = this.guild?.id
      ? `guild:${this.guild.id}:${this.channelId}:${this.id}`
      : `call:${this.channelId}:${this.id}`;
    return this.client.api.streams[encodeURIComponent(streamKey)].preview.post({
      data: {
        thumbnail: base64Image,
      },
    });
  }

  /**
   * Fetches this voice state.
   * @param {boolean} [force=true] Whether to skip the cache check and request the API
   * @returns {Promise<VoiceState>}
   */
  fetch(force = true) {
    return this.guild?.voiceStates?.fetch(this.id, { force });
  }

  toJSON() {
    return super.toJSON({
      id: true,
      serverDeaf: true,
      serverMute: true,
      selfDeaf: true,
      selfMute: true,
      selfVideo: true,
      sessionId: true,
      channelId: 'channel',
    });
  }
}

module.exports = VoiceState;
