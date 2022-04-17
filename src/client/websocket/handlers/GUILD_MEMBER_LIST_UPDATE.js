'use strict';

const { Collection } = require('@discordjs/collection');
const { Events } = require('../../../util/Constants');

module.exports = (client, { d: data }) => {
  // Console.log(data);
  // console.log(data.ops[0])
  const guild = client.guilds.cache.get(data.guild_id);
  if (!guild) return;
  const members = new Collection();
  // Get Member from side Discord Channel (online counting if large server)
  for (const object of data.ops) {
    if (object.op == 'SYNC') {
      for (const member_ of object.items) {
        const member = member_.member;
        if (!member) continue;
        members.set(member.user.id, guild.members._add(member));
        if (member.presence) {
          guild.presences._add(Object.assign(member.presence, { guild }));
        }
      }
    } else if (object.op == 'INVALIDATE') {
      client.emit(Events.DEBUG, `Invalidate [${object.range[0]}, ${object.range[1]}]`);
    } else if (object.op == 'UPDATE' || object.op == 'INSERT') {
      const member = object.item.member;
      if (!member) continue;
      members.set(member.user.id, guild.members._add(member));
      if (member.presence) {
        guild.presences._add(Object.assign(member.presence, { guild }));
      }
    } else if (object.op == 'DELETE') {
      // Nothing;
    }
  }
  client.emit(Events.GUILD_MEMBER_LIST_UPDATE, members, guild, data);
};
