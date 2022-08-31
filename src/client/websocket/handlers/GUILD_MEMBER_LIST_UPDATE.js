'use strict';

const { Collection } = require('@discordjs/collection');
const { Events } = require('../../../util/Constants');

module.exports = (client, { d: data }) => {
  const guild = client.guilds.cache.get(data.guild_id);
  if (!guild) return;
  const members = new Collection();
  // Get Member from side Discord Channel (online counting if large server)
  for (const object of data.ops) {
    switch (object.op) {
      case 'SYNC': {
        for (const member_ of object.items) {
          const member = member_.member;
          if (!member) continue;
          members.set(member.user.id, guild.members._add(member));
          if (member.presence) {
            guild.presences._add(Object.assign(member.presence, { guild }));
          }
        }
        break;
      }
      case 'INVALIDATE': {
        client.emit(
          Events.DEBUG,
          `Invalidate [${object.range[0]}, ${object.range[1]}], Fetching GuildId: ${data.guild_id}`,
        );
        break;
      }
      case 'UPDATE':
      case 'INSERT': {
        const member = object.item.member;
        if (!member) continue;
        members.set(member.user.id, guild.members._add(member));
        if (member.presence) {
          guild.presences._add(Object.assign(member.presence, { guild }));
        }
        break;
      }
      case 'DELETE': {
        break;
      }
    }
  }
  /**
   * Emitted whenever a guild member list (sidebar) is updated.
   * @event Client#guildMemberListUpdate
   * @param {Collection<Snowflake, GuildMember>} members Members that were updated
   * @param {Guild} guild Guild
   * @param {string} type Type of update (INVALIDATE | UPDATE | INSERT | DELETE | SYNC)
   * @param {data} raw Raw data
   */
  client.emit(Events.GUILD_MEMBER_LIST_UPDATE, members, guild, data.ops[0].op, data);
};
