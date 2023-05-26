'use strict';

const ThreadManager = require('./ThreadManager');
const { TypeError } = require('../errors');
const MessagePayload = require('../structures/MessagePayload');
const { resolveAutoArchiveMaxLimit, getAttachments, uploadFile } = require('../util/Util');

/**
 * Manages API methods for threads in forum channels and stores their cache.
 * @extends {ThreadManager}
 */
class GuildForumThreadManager extends ThreadManager {
  /**
   * The channel this Manager belongs to
   * @name GuildForumThreadManager#channel
   * @type {ForumChannel}
   */

  /**
   * @typedef {BaseMessageOptions} GuildForumThreadMessageCreateOptions
   * @property {StickerResolvable} [stickers] The stickers to send with the message
   * @property {BitFieldResolvable} [flags] The flags to send with the message.
   * Only `SUPPRESS_EMBEDS`, `SUPPRESS_NOTIFICATIONS` and `IS_VOICE_MESSAGE` can be set.
   */

  /**
   * Options for creating a thread.
   * @typedef {StartThreadOptions} GuildForumThreadCreateOptions
   * @property {GuildForumThreadMessageCreateOptions|MessagePayload} message The message associated with the thread post
   * @property {Snowflake[]} [appliedTags] The tags to apply to the thread
   */

  /**
   * Creates a new thread in the channel.
   * @param {GuildForumThreadCreateOptions} [options] Options to create a new thread
   * @returns {Promise<ThreadChannel>}
   * @example
   * // Create a new forum post
   * forum.threads
   *   .create({
   *     name: 'Food Talk',
   *     autoArchiveDuration: 60,
   *     message: {
   *      content: 'Discuss your favorite food!',
   *     },
   *     reason: 'Needed a separate thread for food',
   *   })
   *   .then(threadChannel => console.log(threadChannel))
   *   .catch(console.error);
   */
  async create({
    name,
    autoArchiveDuration = this.channel.defaultAutoArchiveDuration,
    message,
    reason,
    rateLimitPerUser,
    appliedTags,
  } = {}) {
    if (!message) {
      throw new TypeError('GUILD_FORUM_MESSAGE_REQUIRED');
    }

    let messagePayload;

    if (message instanceof MessagePayload) {
      messagePayload = await message.resolveData();
    } else {
      messagePayload = await MessagePayload.create(this, message).resolveData();
    }

    let { data: body, files } = await messagePayload.resolveFiles();

    if (typeof message == 'object' && typeof message.usingNewAttachmentAPI !== 'boolean') {
      message.usingNewAttachmentAPI = this.client.options.usingNewAttachmentAPI;
    }

    if (message?.usingNewAttachmentAPI === true) {
      const attachments = await getAttachments(this.client, this.channel.id, ...files);
      const requestPromises = attachments.map(async attachment => {
        await uploadFile(files[attachment.id].file, attachment.upload_url);
        return {
          id: attachment.id,
          filename: files[attachment.id].name,
          uploaded_filename: attachment.upload_filename,
          description: files[attachment.id].description,
          duration_secs: files[attachment.id].duration_secs,
          waveform: files[attachment.id].waveform,
        };
      });
      const attachmentsData = await Promise.all(requestPromises);
      attachmentsData.sort((a, b) => parseInt(a.id) - parseInt(b.id));
      body.attachments = attachmentsData;
      files = [];
    }

    if (autoArchiveDuration === 'MAX') autoArchiveDuration = resolveAutoArchiveMaxLimit(this.channel.guild);

    const data = await this.client.api.channels(this.channel.id).threads.post({
      data: {
        name,
        auto_archive_duration: autoArchiveDuration,
        rate_limit_per_user: rateLimitPerUser,
        applied_tags: appliedTags,
        message: body,
      },
      files,
      reason,
    });

    return this.client.actions.ThreadCreate.handle(data).thread;
  }
}

module.exports = GuildForumThreadManager;
