'use strict';

const Action = require('./Action');
const VoiceState = require('../../structures/VoiceState');
const { Events } = require('../../util/Constants');

class VoiceStateUpdate extends Action {
  handle(data) {
    const client = this.client;
    const guild = client.guilds.cache.get(data.guild_id);
    if (guild) {
      // Update the state
      const oldState =
        guild.voiceStates.cache.get(data.user_id)?._clone() ?? new VoiceState(guild, { user_id: data.user_id });

      const newState = guild.voiceStates._add(data);

      // Get the member
      let member = guild.members.cache.get(data.user_id);
      if (member && data.member) {
        member._patch(data.member);
      } else if (data.member?.user && data.member.joined_at) {
        member = guild.members._add(data.member);
      }

      /**
       * Emitted whenever a member changes voice state - e.g. joins/leaves a channel, mutes/unmutes.
       * @event Client#voiceStateUpdate
       * @param {VoiceState} oldState The voice state before the update
       * @param {VoiceState} newState The voice state after the update
       */
      client.emit(Events.VOICE_STATE_UPDATE, oldState, newState);
    } else {
      // Update the state
      const oldState =
        client.voiceStates.cache.get(data.user_id)?._clone() ?? new VoiceState({ client }, { user_id: data.user_id });

      const newState = client.voiceStates._add(data);

      client.emit(Events.VOICE_STATE_UPDATE, oldState, newState);
    }
    // Emit event
    if (data.user_id === client.user?.id) {
      client.emit('debug', `[VOICE] received voice state update: ${JSON.stringify(data)}`);
      client.voice.onVoiceStateUpdate(data);
    }
  }
}

module.exports = VoiceStateUpdate;
