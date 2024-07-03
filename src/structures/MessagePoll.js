'use strict';

const { Collection } = require('@discordjs/collection');
const { MessagePollLayoutTypes } = require('../util/Constants');
const Util = require('../util/Util');

/**
 * Represents the poll object has a lot of levels and nested structures. It was also designed to support future extensibility, so some fields may appear to be more complex than necessary.
 */
class MessagePoll {
  /**
   * @param {Object} data Message poll to clone or raw data
   */
  constructor(data = {}) {
    this._patch(data);
  }

  _patch(data = {}) {
    if (data?.constructor?.name == 'MessagePoll') data = data.toJSON();
    /**
     * The poll media object is a common object that backs both the question and answers. For now, `question` only supports `text`, while `answers` can have an optional `emoji`.
     * @see {@link https://docs.discord.sex/resources/message#poll-media-structure}
     * @typedef {Object} MessagePollMedia
     * @property {?string} text The text of the field (max 300 characters for question, 55 characters for answer)
     * @property {?RawEmoji} emoji The emoji of the field
     */

    if ('question' in data) {
      /**
       * The question of the poll
       * @type {?MessagePollMedia}
       */
      this.question = this._resolvePollMedia(data.question);
    } else {
      this.question ??= null;
    }

    if (data.answers?.length) {
      /**
       * The answers available in the poll
       * @type {Collection<number, MessagePollMedia>}
       */
      this.answers = new Collection();

      data.answers.forEach((obj, index) => {
        this.answers.set(obj?.answer_id || index + 1, this._resolvePollMedia(obj.poll_media));
      });
    } else {
      this.answers ??= new Collection();
    }

    if ('layout_type' in data) {
      /**
       * The layout type of the poll
       * @type {?MessagePollLayoutTypes}
       */
      this.layoutType = MessagePollLayoutTypes[data.layout_type];
    } else {
      this.layoutType ??= MessagePollLayoutTypes[1]; // Default type
    }

    if ('allow_multiselect' in data) {
      /**
       * Whether a user can select multiple answers
       * @type {boolean}
       */
      this.allowMultiSelect = !!data.allow_multiselect;
    } else {
      this.allowMultiSelect ??= false;
    }

    if ('expiry' in data) {
      /**
       * When the poll ends
       * @type {?Date}
       */
      this.expiry = new Date(data.expiry);
    } else {
      this.expiry ??= null;
    }

    if ('duration' in data) {
      /**
       * Number of hours the poll should be open for (max 32 days, default 1)
       * @type {?Number}
       */
      this.duration = data.duration;
    } else {
      this.duration ??= null;
    }

    if ('results' in data) {
      /**
       * Poll Results Structure
       * @see {@link https://docs.discord.sex/resources/message#poll-results-structure}
       * @typedef {Object} MessagePollResult
       * @property {boolean} isFinalized Whether the votes have been precisely counted
       * @property {Collection<number, MessagePollResultAnswerCount>} answerCounts The counts for each answer
       */
      /**
       * Poll Answer Count Structure
       * @see {@link https://docs.discord.sex/resources/message#poll-answer-count-structure}
       * @typedef {Object} MessagePollResultAnswerCount
       * @property {MessagePollMedia} answer answer
       * @property {number} count The number of votes for this answer
       * @property {boolean} selfVoted Whether the current user voted for this answer
       */
      /**
       * In a nutshell, this contains the number of votes for each answer.
       * The `results` field may be not present in certain responses where, as an implementation detail,
       * Discord does not fetch the poll results in the backend.
       * This should be treated as "unknown results", as opposed to "no results".
       * You can keep using the results if you have previously received them through other means.
       * Due to the intricacies of counting at scale, while a poll is in progress the results may not
       * be perfectly accurate. They usually are accurate, and shouldn't deviate significantly — it's
       * just difficult to make guarantees. To compensate for this, after a poll is finished there is
       * a background job which performs a final, accurate tally of votes. This tally concludes once
       * `is_finalized` is `true`. Polls that have ended will also always contain results.
       * If `answer_counts` does not contain an entry for a particular answer, then there are no votes
       * for that answer.
       * @type {?MessagePollResult}
       */
      this.results = {
        isFinalized: data.results.is_finalized,
        answerCounts: new Collection(),
      };
      data.results.answer_counts.forEach(obj => {
        this.results.answerCounts.set(obj.id, {
          count: obj.count,
          selfVoted: obj.me_voted,
          answer: this.answers.get(obj.id),
        });
      });
    } else {
      this.results ??= null;
    }
  }

  _resolvePollMedia(obj) {
    return {
      text: obj.text,
      emoji: Util.resolvePartialEmoji(obj.emoji),
    };
  }

  /**
   * Convert to JSON
   * @returns {Object}
   */
  toJSON() {
    const data = {
      question: {
        text: this.question.text,
        emoji: this.question.emoji,
      },
      expiry: this.expiry?.toISOString(),
      allow_multiselect: this.allowMultiSelect,
      layout_type: typeof this.layoutType == 'number' ? this.layoutType : MessagePollLayoutTypes[this.layoutType],
      answers: Array.from(this.answers.entries()).map(([id, data]) => ({
        answer_id: id,
        poll_media: {
          text: data.text,
          emoji: data.emoji,
        },
      })),
      duration: this.duration ?? 1,
    };
    if (this.results) {
      data.results = {
        is_finalized: this.results.isFinalized,
        answer_counts: Array.from(this.results.answerCounts.entries()).map(([id, data]) => ({
          id: id,
          count: data.count,
          me_voted: data.selfVoted,
        })),
      };
    }
    return data;
  }

  /**
   * Set question
   * @param {string} text question
   * @returns {MessagePoll}
   */
  setQuestion(text) {
    this.question = {
      text,
    };
    return this;
  }

  /**
   * Set answers
   * @param {MessagePollMedia[]} answers answers
   * @returns {MessagePoll}
   */
  setAnswers(answers) {
    this.answers.clear();
    answers.forEach((obj, index) => {
      this.answers.set(index + 1, this._resolvePollMedia(obj));
    });
    return this;
  }

  /**
   * Add answer
   * @param {MessagePollMedia} answer answer
   * @returns {MessagePoll}
   */
  addAnswer(answer) {
    this.answers.set(this.answers.size + 1, answer);
    return this;
  }

  /**
   * Set allow multi select
   * @param {boolean} state state
   * @returns {MessagePoll}
   */
  setAllowMultiSelect(state) {
    this.allowMultiSelect = state;
    return this;
  }

  /**
   * Set duration
   * @param {number} duration duration (hours)
   * @returns {MessagePoll}
   */
  setDuration(duration) {
    // [1, 4, 8, 24, 72, 168, 336];
    this.duration = duration;
    return this;
  }
}

module.exports = MessagePoll;
