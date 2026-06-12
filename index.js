const {
  Client, GatewayIntentBits, Events, AuditLogEvent,
  PermissionsBitField, REST, Routes, SlashCommandBuilder,
  EmbedBuilder, MessageFlags,
} = require('discord.js');
const http = require('http');
const fs   = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildExpressions,
    GatewayIntentBits.MessageContent,
  ],
});

const PORT = process.env.PORT || 3001;
http.createServer((req, res) => { res.writeHead(200); res.end('Bot is running ✅'); }).listen(PORT, () => {
  console.log(`🌐 Keep-alive server running on port ${PORT}`);
});

const BOT_OWNER_ID   = '1224722940701048927';
const BOT_TOKEN      = process.env.BOT_TOKEN || 'MTUxMTUwOTk2MDMzNTQyNTYyNg.GPAvb7.3LM1mxx2hnPLd3H-Gv3axhPS39w6Rv6zBYGUAw';
const CLIENT_ID      = '1511509960335425626';
const LOG_CHANNEL_ID = '1513261574012407858';

const roomConfigs = [
  { channelId: '1160272271806574753', message: '🔥** 3 الاف روبوكس مجاني** <#1513236872153792682>', every: 2, webhookName: 'Ez shadow' },
  { channelId: '1160271731810906152', message: '🔥** 3 الاف روبوكس مجاني** <#1513236872153792682>', every: 2, webhookName: 'Ez shadow' },
  { channelId: '1409582649487659152', message: '🔥** 3 الاف روبوكس مجاني** <#1513236872153792682>', every: 2, webhookName: 'Ez shadow' },
  { channelId: '1465885721083777034', message: '🔥** 3 الاف روبوكس مجاني** <#1513236872153792682>', every: 2, webhookName: 'Ez shadow' },
  { channelId: '1401133375015747706', message: '🔥** 3 الاف روبوكس مجاني** <#1513236872153792682>', every: 2, webhookName: 'Ez shadow' },
  { channelId: '1493332535365599303', message: '🔥** 3 الاف روبوكس مجاني** <#1513236872153792682>', every: 2, webhookName: 'Ez shadow' },
  { channelId: '1461763814146965688', message: '🔥** 3 الاف روبوكس مجاني** <#1513236872153792682>', every: 2, webhookName: 'Ez shadow' },
  { channelId: '1464024227761098896', message: '🔥** 3 الاف روبوكس مجاني** <#1513236872153792682>', every: 2, webhookName: 'Ez shadow' },
  { channelId: '1461764244646268958', message: '🔥** 3 الاف روبوكس مجاني** <#1513236872153792682>', every: 2, webhookName: 'Ez shadow' },
  { channelId: '1461764456634646538', message: '🔥** 3 الاف روبوكس مجاني** <#1513236872153792682>', every: 2, webhookName: 'Ez shadow' },
  { channelId: '1507029588109168822', message: '🔥** 3 الاف روبوكس مجاني** <#1513236872153792682>', every: 2, webhookName: 'Ez shadow' },
  { channelId: '1489362661543121078', message: '🔥** 3 الاف روبوكس مجاني** <#1513236872153792682>', every: 2, webhookName: 'Ez shadow' },
];

const PROTECTION = { serverSettings: true, antiRaid: false, antiBots: true };
const LIMITS     = { bans: 10, channelDeletes: 2, roleDeletes: 2 };
// =============================================

// ======= Advanced Whitelist =======
// Structure:
// {
//   users:        [userId, ...]       — full whitelist (bypasses all protections)
//   roles:        [roleId, ...]       — full whitelist for a role
//   channelDel:   [userId/roleId, ...]— allowed to delete channels without punishment
//   bots:         [botId, ...]        — specific bots allowed to be added
//   webhookCreate:[userId/roleId, ...]— allowed to create webhooks anywhere
//   ban:          [userId/roleId, ...]— allowed to ban without punishment
//   addBots:      [userId/roleId, ...]— allowed to add bots
// }
const WL_FILE = './whitelist.json';
function loadWhitelist() {
  try {
    const data = JSON.parse(fs.readFileSync(WL_FILE, 'utf8'));
    if (Array.isArray(data)) return { users: data, roles: [], channelDel: [], bots: [], webhookCreate: [], ban: [], addBots: [] };
    return { users: [], roles: [], channelDel: [], bots: [], webhookCreate: [], ban: [], addBots: [], ...data };
  } catch {
    return { users: [], roles: [], channelDel: [], bots: [], webhookCreate: [], ban: [], addBots: [] };
  }
}
function saveWhitelist() { fs.writeFileSync(WL_FILE, JSON.stringify(whitelist, null, 2)); }
let whitelist = loadWhitelist();

// Full whitelist check — bypasses everything
function isWhitelisted(userId, memberRoles = []) {
  if (userId === BOT_OWNER_ID) return true;
  if (whitelist.users.includes(userId)) return true;
  if (memberRoles.some(r => whitelist.roles.includes(r))) return true;
  return false;
}

// Specific whitelist check — only bypasses that protection type
function hasSpecificWL(userId, memberRoles = [], type) {
  if (isWhitelisted(userId, memberRoles)) return true;
  const list = whitelist[type] || [];
  if (list.includes(userId)) return true;
  if (memberRoles.some(r => list.includes(r))) return true;
  return false;
}

async function getMemberRoles(guild, userId) {
  try {
    const m = await guild.members.fetch(userId);
    return m.roles.cache.map(r => r.id);
  } catch { return []; }
}

// ======= Random server emoji =======
function getRandomEmoji(guild) {
  try {
    const emojis = guild?.emojis?.cache;
    if (!emojis || emojis.size === 0) return '⚡';
    const arr = [...emojis.values()];
    return arr[Math.floor(Math.random() * arr.length)].toString();
  } catch { return '⚡'; }
}

// ======= Daily counter =======
const dailyActions = {};
function getToday() { return new Date().toISOString().split('T')[0]; }
function incrementCount(userId, action) {
  const t = getToday();
  if (!dailyActions[userId]) dailyActions[userId] = {};
  if (!dailyActions[userId][t]) dailyActions[userId][t] = {};
  dailyActions[userId][t][action] = (dailyActions[userId][t][action] || 0) + 1;
  return dailyActions[userId][t][action];
}

// ======= Colors =======
const COLORS = { danger: 0xE24B4A, warn: 0xFAA61A, success: 0x57C97A, info: 0x5865F2 };

// ======= Log embed builder =======
function buildLogMessage({ type, executor, violation, punishment, extra = [], color = COLORS.danger, guild = null }) {
  const e1 = guild ? getRandomEmoji(guild) : '⚡';
  const e2 = guild ? getRandomEmoji(guild) : '🔥';
  const e3 = guild ? getRandomEmoji(guild) : '✨';

  const titles = {
    ban:          `${e1} تبنيد عضو`,
    serverEdit:   `${e1} تغيير إعدادات السيرفر`,
    adminRole:    `${e1} إعطاء صلاحية Administrator`,
    channelDel:   `${e1} حذف روم`,
    roleDel:      `${e1} حذف رتبة`,
    botAdd:       `${e1} إضافة بوت غير مصرح`,
    whitelist:    `${e1} تعديل الوايت ليست`,
    webhook:      `${e1} إنشاء ويبهوك`,
    kick:         `${e1} طرد عضو`,
  };

  const typeLabels = {
    ban:        '🔴 تبنيد',       serverEdit: '🔴 تغيير السيرفر',
    adminRole:  '🔴 صلاحية Admin', channelDel: '🟡 حذف روم',
    roleDel:    '🟡 حذف رتبة',    botAdd:     '🔴 بوت غير مصرح',
    whitelist:  '🟢 وايت ليست',   webhook:    '🟡 ويبهوك',
    kick:       '🟡 طرد',
  };

  const desc = [
    `${e2} **المنفّذ**`,
    `> ${executor || 'غير معروف'}`,
    '',
    `${e3} **المخالفة**`,
    `> ${violation || '—'}`,
    '',
    `⚠️ **العقوبة**`,
    `> ${punishment || '—'}`,
  ];

  if (extra.length) extra.forEach(e => desc.push('', `**${e.name}**`, `> ${e.value}`));

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(titles[type] || `${e1} ${type}`)
    .setDescription(desc.join('\n'))
    .addFields([{ name: '━━━━━━━━━━━━━━━━━━', value: `\`${typeLabels[type] || type}\` • <t:${Math.floor(Date.now() / 1000)}:R>`, inline: false }])
    .setThumbnail(client.user.displayAvatarURL())
    .setFooter({ text: 'نظام الحماية • by zwh.', iconURL: client.user.displayAvatarURL() })
    .setTimestamp();
}

async function sendLog(options) {
  try {
    const channel = await client.channels.fetch(LOG_CHANNEL_ID);
    if (!channel) return;
    await channel.send({ embeds: [buildLogMessage(options)] });
  } catch (err) { console.error(`❌ Log failed: ${err.message}`); }
}

async function punish(guild, userId, reason) {
  try {
    await guild.members.ban(userId, { reason: `Auto-protection: ${reason}` });
    console.log(`🔨 Banned ${userId} — ${reason}`);
  } catch (err) { console.error(`❌ Ban failed: ${err.message}`); }
}

async function kick(guild, userId, reason) {
  try {
    const member = await guild.members.fetch(userId);
    await member.kick(`Auto-protection: ${reason}`);
    console.log(`👢 Kicked ${userId} — ${reason}`);
  } catch (err) { console.error(`❌ Kick failed: ${err.message}`); }
}

async function getAuditUser(guild, auditAction, targetId = null) {
  try {
    await new Promise(r => setTimeout(r, 500));
    const logs  = await guild.fetchAuditLogs({ limit: 1, type: auditAction });
    const entry = logs.entries.first();
    if (!entry) return null;
    if (targetId && entry.target?.id !== targetId) return null;
    return entry.executor;
  } catch { return null; }
}

// ======= Reply embed builder =======
function replyEmbed({ color, title, description, fields = [], footer = 'by zwh.' }) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .addFields(fields)
    .setThumbnail(client.user.displayAvatarURL())
    .setFooter({ text: footer, iconURL: client.user.displayAvatarURL() })
    .setTimestamp();
}

// =======================================
//   Register slash commands
// =======================================
async function registerCommands() {
  const wlTypes = [
    { name: '🛡️ Full Whitelist — User',         value: 'user' },
    { name: '👑 Full Whitelist — Role',          value: 'role' },
    { name: '🤖 Whitelist — Add Bots',           value: 'addBots' },
    { name: '⚖️ Whitelist — Ban',               value: 'ban' },
    { name: '#️⃣ Whitelist — Channel Delete',    value: 'channelDel' },
    { name: '🪝 Whitelist — Webhook Create',     value: 'webhookCreate' },
    { name: '🤖 Whitelist — Specific Bot',       value: 'bots' },
  ];

  const commands = [
    new SlashCommandBuilder()
      .setName('whitelist')
      .setDescription('Manage the advanced whitelist')
      .addSubcommand(s => s.setName('add').setDescription('Add a user, role, or channel to the whitelist')
        .addStringOption(o => o.setName('type').setDescription('Whitelist type').setRequired(true).addChoices(...wlTypes))
        .addUserOption(o => o.setName('user').setDescription('User or bot'))
        .addRoleOption(o => o.setName('role').setDescription('Role'))
        .addChannelOption(o => o.setName('channel').setDescription('Channel')))
      .addSubcommand(s => s.setName('remove').setDescription('Remove from the whitelist')
        .addStringOption(o => o.setName('type').setDescription('Whitelist type').setRequired(true).addChoices(...wlTypes))
        .addUserOption(o => o.setName('user').setDescription('User or bot'))
        .addRoleOption(o => o.setName('role').setDescription('Role'))
        .addChannelOption(o => o.setName('channel').setDescription('Channel')))
      .addSubcommand(s => s.setName('list').setDescription('View the full whitelist'))
      .toJSON(),

    new SlashCommandBuilder()
      .setName('protection')
      .setDescription('Manage bot protections')
      .addSubcommand(s => s.setName('status').setDescription('View protection status'))
      .addSubcommand(s => s.setName('toggle').setDescription('Enable or disable a protection')
        .addStringOption(o => o.setName('type').setDescription('Protection type').setRequired(true).addChoices(
          { name: 'Server Settings + Admin', value: 'serverSettings' },
          { name: 'Anti-Raid',               value: 'antiRaid' },
          { name: 'Anti-Bots',               value: 'antiBots' },
        ))
        .addBooleanOption(o => o.setName('enabled').setDescription('Enable or disable').setRequired(true)))
      .addSubcommand(s => s.setName('limits').setDescription('Edit daily action limits')
        .addIntegerOption(o => o.setName('bans').setDescription('Daily ban limit').setMinValue(1))
        .addIntegerOption(o => o.setName('channels').setDescription('Channel delete limit').setMinValue(1))
        .addIntegerOption(o => o.setName('roles').setDescription('Role delete limit').setMinValue(1)))
      .toJSON(),

    new SlashCommandBuilder()
      .setName('webhooks')
      .setDescription('Manage webhooks')
      .addSubcommand(s => s.setName('list').setDescription('List all webhooks'))
      .addSubcommand(s => s.setName('delete').setDescription('Delete a webhook')
        .addStringOption(o => o.setName('id').setDescription('Webhook ID').setRequired(true)))
      .toJSON(),
  ];

  const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✅ Slash commands registered');
  } catch (err) { console.error(`❌ Failed to register commands: ${err.message}`); }
}

// =======================================
//   Protection 1 — Server Settings + Admin
// =======================================
const guildUpdateCooldown = new Set();
client.on(Events.GuildUpdate, async (oldGuild, newGuild) => {
  if (!PROTECTION.serverSettings) return;
  if (guildUpdateCooldown.has(newGuild.id)) return;
  const changed = oldGuild.name !== newGuild.name || oldGuild.icon !== newGuild.icon
    || oldGuild.banner !== newGuild.banner || oldGuild.vanityURLCode !== newGuild.vanityURLCode;
  if (!changed) return;
  const executor = await getAuditUser(newGuild, AuditLogEvent.GuildUpdate);
  if (!executor || executor.id === client.user.id) return;
  const roles = await getMemberRoles(newGuild, executor.id);
  if (isWhitelisted(executor.id, roles)) return;
  await sendLog({ type: 'serverEdit', executor: `<@${executor.id}>`, violation: 'Changed server settings without permission', punishment: '🔨  ban', color: COLORS.danger, guild: newGuild });
  guildUpdateCooldown.add(newGuild.id);
  setTimeout(() => guildUpdateCooldown.delete(newGuild.id), 5000);
  await punish(newGuild, executor.id, 'Changed server settings');
  try {
    if (oldGuild.name !== newGuild.name) await newGuild.setName(oldGuild.name);
    if (oldGuild.vanityURLCode !== newGuild.vanityURLCode && oldGuild.vanityURLCode) await newGuild.setVanityCode(oldGuild.vanityURLCode);
  } catch {}
});

const memberRoleCooldown = new Set();
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  if (!PROTECTION.serverSettings) return;
  if (memberRoleCooldown.has(newMember.id)) return;
  const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
  const dangerRole = addedRoles.find(r => r.permissions.has(PermissionsBitField.Flags.Administrator));
  if (!dangerRole) return;
  const executor = await getAuditUser(newMember.guild, AuditLogEvent.MemberRoleUpdate, newMember.id);
  if (!executor || executor.id === client.user.id) return;
  const roles = await getMemberRoles(newMember.guild, executor.id);
  if (isWhitelisted(executor.id, roles)) return;
  await sendLog({ type: 'adminRole', executor: `<@${executor.id}>`, violation: `Gave role **${dangerRole.name}** (Admin) to <@${newMember.id}>`, punishment: '🔨  ban + role removed', color: COLORS.danger, guild: newMember.guild });
  memberRoleCooldown.add(newMember.id);
  setTimeout(() => memberRoleCooldown.delete(newMember.id), 5000);
  try { await newMember.roles.remove(dangerRole); } catch {}
  await punish(newMember.guild, executor.id, 'Gave Administrator role without permission');
});

const roleUpdateCooldown = new Set();
client.on(Events.GuildRoleUpdate, async (oldRole, newRole) => {
  if (!PROTECTION.serverSettings) return;
  if (roleUpdateCooldown.has(newRole.id)) return;
  const hadAdmin = oldRole.permissions.has(PermissionsBitField.Flags.Administrator);
  const hasAdmin = newRole.permissions.has(PermissionsBitField.Flags.Administrator);
  if (hadAdmin || !hasAdmin) return;
  const executor = await getAuditUser(newRole.guild, AuditLogEvent.RoleUpdate, newRole.id);
  if (!executor || executor.id === client.user.id) return;
  const roles = await getMemberRoles(newRole.guild, executor.id);
  if (isWhitelisted(executor.id, roles)) return;
  await sendLog({ type: 'adminRole', executor: `<@${executor.id}>`, violation: `Added Administrator permission to role **${newRole.name}**`, punishment: '🔨  ban + permissions restored', color: COLORS.danger, guild: newRole.guild });
  roleUpdateCooldown.add(newRole.id);
  setTimeout(() => roleUpdateCooldown.delete(newRole.id), 5000);
  try { await newRole.setPermissions(oldRole.permissions); } catch {}
  await punish(newRole.guild, executor.id, 'Added Administrator to a role');
});

// =======================================
//   Protection 2 — Anti-Raid
// =======================================
client.on(Events.ChannelDelete, async (channel) => {
  if (!PROTECTION.antiRaid || !channel.guild) return;
  const executor = await getAuditUser(channel.guild, AuditLogEvent.ChannelDelete, channel.id);
  if (!executor) return;
  const roles = await getMemberRoles(channel.guild, executor.id);
  // channelDel whitelist — allowed to delete channels without punishment
  if (hasSpecificWL(executor.id, roles, 'channelDel')) return;
  const count = incrementCount(executor.id, 'channelDeletes');
  const over  = count >= LIMITS.channelDeletes;
  await sendLog({ type: 'channelDel', executor: `<@${executor.id}>`, violation: `Deleted **${channel.name}** — ${count}/${LIMITS.channelDeletes}`, punishment: over ? '🔨  ban' : `⚠️ Warning — ${LIMITS.channelDeletes - count} remaining`, color: over ? COLORS.danger : COLORS.warn, guild: channel.guild });
  if (over) await punish(channel.guild, executor.id, `Exceeded channel delete limit (${LIMITS.channelDeletes}/day)`);
});

client.on(Events.GuildRoleDelete, async (role) => {
  if (!PROTECTION.antiRaid) return;
  const executor = await getAuditUser(role.guild, AuditLogEvent.RoleDelete, role.id);
  if (!executor) return;
  const roles = await getMemberRoles(role.guild, executor.id);
  if (isWhitelisted(executor.id, roles)) return;
  const count = incrementCount(executor.id, 'roleDeletes');
  const over  = count >= LIMITS.roleDeletes;
  await sendLog({ type: 'roleDel', executor: `<@${executor.id}>`, violation: `Deleted role **${role.name}** — ${count}/${LIMITS.roleDeletes}`, punishment: over ? '🔨  ban' : `⚠️ Warning — ${LIMITS.roleDeletes - count} remaining`, color: over ? COLORS.danger : COLORS.warn, guild: role.guild });
  if (over) await punish(role.guild, executor.id, `Exceeded role delete limit (${LIMITS.roleDeletes}/day)`);
});

// Ban protection — kick instead of ban when limit exceeded
client.on(Events.GuildAuditLogEntryCreate, async (entry, guild) => {
  if (!PROTECTION.antiRaid) return;
  if (entry.action !== AuditLogEvent.MemberBanAdd) return;
  const executor = entry.executor;
  if (!executor || executor.id === client.user.id) return;
  const roles = await getMemberRoles(guild, executor.id);
  // ban whitelist — allowed to ban without punishment
  if (hasSpecificWL(executor.id, roles, 'ban')) return;
  const count = incrementCount(executor.id, 'bans');
  const over  = count >= LIMITS.bans;
  await sendLog({ type: 'ban', executor: `<@${executor.id}>`, violation: `Banned <@${entry.target?.id}> — ${count}/${LIMITS.bans}`, punishment: over ? '👢 Kicked from server' : `⚠️ Warning — ${LIMITS.bans - count} remaining`, color: COLORS.warn, guild });
  if (over) await kick(guild, executor.id, `Exceeded daily ban limit (${LIMITS.bans}/day)`);
});

// =======================================
//   Protection 3 — Anti-Bots
// =======================================
client.on(Events.GuildMemberAdd, async (member) => {
  if (!PROTECTION.antiBots || !member.user.bot) return;
  // specific bot whitelist
  if (whitelist.bots.includes(member.id)) return;
  const executor = await getAuditUser(member.guild, AuditLogEvent.BotAdd, member.id);
  const roles = executor ? await getMemberRoles(member.guild, executor.id) : [];
  // addBots whitelist — allowed to add bots
  if (executor && hasSpecificWL(executor.id, roles, 'addBots')) return;
  await sendLog({ type: 'botAdd', executor: executor ? `<@${executor.id}>` : 'Unknown', violation: `Added bot <@${member.id}> without permission`, punishment: '🔨 Bot banned + adder banned', color: COLORS.danger, guild: member.guild });
  await punish(member.guild, member.id, 'Unauthorized bot added');
  if (executor && !isWhitelisted(executor.id, roles)) await punish(member.guild, executor.id, 'Added unauthorized bot');
});

// =======================================
//   Protection 4 — Webhook guard
// =======================================
client.on(Events.WebhooksUpdate, async (channel) => {
  if (!PROTECTION.serverSettings) return;
  try {
    const executor = await getAuditUser(channel.guild, AuditLogEvent.WebhookCreate);
    if (!executor || executor.id === client.user.id) return;
    const roles = await getMemberRoles(channel.guild, executor.id);
    // webhookCreate whitelist — allowed to create webhooks anywhere
    if (hasSpecificWL(executor.id, roles, 'webhookCreate')) return;
    const hooks   = await channel.fetchWebhooks();
    const newHook = hooks.find(h => h.owner?.id === executor.id);
    await sendLog({ type: 'webhook', executor: `<@${executor.id}>`, violation: `Created webhook in <#${channel.id}>`, punishment: '🔨  ban + webhook deleted', color: COLORS.danger, guild: channel.guild });
    if (newHook) try { await newHook.delete(); } catch {}
    await punish(channel.guild, executor.id, 'Created unauthorized webhook');
  } catch {}
});

// =======================================
//   Interactions
// =======================================
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const ownerOnly = async () => {
    if (interaction.user.id !== BOT_OWNER_ID) {
      await interaction.reply({
        embeds: [replyEmbed({ color: COLORS.danger, title: '🚫 Access Denied', description: '> This command is for <@1224722940701048927>  only.' })],
        ephemeral: true,
      });
      return false;
    }
    return true;
  };

  // ===================== /webhooks =====================
  if (interaction.commandName === 'webhooks') {
    if (!await ownerOnly()) return;
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });

    if (sub === 'list') {
      try {
        const all = await interaction.guild.fetchWebhooks();
        if (!all.size) return interaction.editReply({ embeds: [replyEmbed({ color: COLORS.info, title: '🪝 Webhooks', description: '> No webhooks found in this server.' })] });
        const lines = all.map(w => {
          const ch   = w.channelId ? `<#${w.channelId}>` : 'Unknown';
          const ow   = w.owner ? `<@${w.owner.id}>` : 'Unknown';
          const mine = w.owner?.id === client.user.id ? ' *(bot)*' : '';
          return `**${w.name}${mine}**\n> 📌 Channel: ${ch}\n> 👤 Owner: ${ow}\n> 🔑 \`${w.id}\``;
        });
        const chunks = []; let cur = '';
        for (const l of lines) { if ((cur + '\n\n' + l).length > 3800) { chunks.push(cur); cur = l; } else cur = cur ? cur + '\n\n' + l : l; }
        if (cur) chunks.push(cur);
        return interaction.editReply({ embeds: chunks.map((c, i) => replyEmbed({ color: COLORS.info, title: i === 0 ? `🪝 Webhooks (${all.size})` : '​', description: c })) });
      } catch (err) {
        return interaction.editReply({ embeds: [replyEmbed({ color: COLORS.danger, title: '❌ Error', description: `Failed to fetch webhooks: ${err.message}` })] });
      }
    }

    if (sub === 'delete') {
      const hookId = interaction.options.getString('id');
      try {
        const hook = await interaction.guild.fetchWebhooks().then(h => h.get(hookId));
        if (!hook) return interaction.editReply({ embeds: [replyEmbed({ color: COLORS.warn, title: '⚠️ Not Found', description: '> No webhook found with that ID.' })] });
        await hook.delete('Manual deletion by owner');
        return interaction.editReply({ embeds: [replyEmbed({ color: COLORS.success, title: '✅ Deleted', description: `> Webhook **${hook.name}** deleted successfully.` })] });
      } catch (err) {
        return interaction.editReply({ embeds: [replyEmbed({ color: COLORS.danger, title: '❌ Error', description: `Failed to delete: ${err.message}` })] });
      }
    }
  }

  // ===================== /protection =====================
  if (interaction.commandName === 'protection') {
    if (!await ownerOnly()) return;
    const sub = interaction.options.getSubcommand();

    if (sub === 'status') {
      const s = v => v ? '✅ Enabled' : '❌ Disabled';
      return interaction.reply({
        embeds: [replyEmbed({
          color: COLORS.info, title: 'Protection Status',
          description: [
            `**Server Settings**`, `> ${s(PROTECTION.serverSettings)}`, '',
            `**Anti-Raid**`, `> ${s(PROTECTION.antiRaid)} — Bans: \`${LIMITS.bans}\` | Channels: \`${LIMITS.channelDeletes}\` | Roles: \`${LIMITS.roleDeletes}\``, '',
            `**Anti-Bots**`, `> ${s(PROTECTION.antiBots)}`,
          ].join('\n'),
        })],
        ephemeral: true,
      });
    }

    if (sub === 'toggle') {
      const type    = interaction.options.getString('type');
      const enabled = interaction.options.getBoolean('enabled');
      const names   = { serverSettings: 'Server Settings + Admin', antiRaid: 'Anti-Raid', antiBots: 'Anti-Bots' };
      PROTECTION[type] = enabled;
      return interaction.reply({
        embeds: [replyEmbed({ color: enabled ? COLORS.success : COLORS.danger, title: enabled ? '✅ Enabled' : '❌ Disabled', description: `> **${names[type]}** is now ${enabled ? 'enabled' : 'disabled'}.` })],
        ephemeral: true,
      });
    }

    if (sub === 'limits') {
      const bans = interaction.options.getInteger('bans');
      const ch   = interaction.options.getInteger('channels');
      const rl   = interaction.options.getInteger('roles');
      const changes = [];
      if (bans != null) { LIMITS.bans           = bans; changes.push(`Bans: \`${bans}\``); }
      if (ch   != null) { LIMITS.channelDeletes = ch;   changes.push(`Channels: \`${ch}\``); }
      if (rl   != null) { LIMITS.roleDeletes    = rl;   changes.push(`Roles: \`${rl}\``); }
      if (!changes.length) return interaction.reply({ embeds: [replyEmbed({ color: COLORS.warn, title: '⚠️', description: '> No values provided.' })], ephemeral: true });
      return interaction.reply({ embeds: [replyEmbed({ color: COLORS.success, title: '✅ Limits Updated', description: `> ${changes.join(' — ')}` })], ephemeral: true });
    }
  }

  // ===================== /whitelist =====================
  if (interaction.commandName === 'whitelist') {
    if (!await ownerOnly()) return;
    const sub  = interaction.options.getSubcommand();
    const type = interaction.options.getString('type');

    // type value → whitelist key
    const keyMap = {
      user: 'users', role: 'roles', addBots: 'addBots',
      ban: 'ban', channelDel: 'channelDel', webhookCreate: 'webhookCreate', bots: 'bots',
    };

    const typeNames = {
      user:          'Full Whitelist (User)',
      role:          'Full Whitelist (Role)',
      addBots:       'Add Bots Whitelist',
      ban:           'Ban Whitelist',
      channelDel:    '#️Channel Delete Whitelist',
      webhookCreate: 'Webhook Create Whitelist',
      bots:          'Specific Bot Whitelist',
    };

    const getTarget = () => {
      const user    = interaction.options.getUser('user');
      const role    = interaction.options.getRole('role');
      const channel = interaction.options.getChannel('channel');
      if (['user', 'ban', 'addBots', 'bots'].includes(type)) {
        if (!user) return { error: 'You must specify a **user or bot**.' };
        return { id: user.id, name: `<@${user.id}>` };
      }
      if (type === 'role') {
        if (!role) return { error: 'You must specify a **role**.' };
        return { id: role.id, name: `<@&${role.id}>` };
      }
      if (['channelDel', 'webhookCreate'].includes(type)) {
        // For channelDel/webhookCreate you can add a user OR a role (not a channel)
        if (user) return { id: user.id, name: `<@${user.id}>` };
        if (role) return { id: role.id, name: `<@&${role.id}>` };
        return { error: 'You must specify a **user** or **role**.' };
      }
      return { error: 'Invalid type.' };
    };

    if (sub === 'add') {
      const target = getTarget();
      if (target.error) return interaction.reply({ embeds: [replyEmbed({ color: COLORS.warn, title: '⚠️', description: `> ${target.error}` })], ephemeral: true });
      const key  = keyMap[type];
      const list = whitelist[key] || [];
      if (list.includes(target.id)) return interaction.reply({ embeds: [replyEmbed({ color: COLORS.warn, title: '⚠️ Already Exists', description: `> ${target.name} is already in **${typeNames[type]}**.` })], ephemeral: true });
      whitelist[key] = [...list, target.id];
      saveWhitelist();
      await sendLog({ type: 'whitelist', executor: `<@${interaction.user.id}>`, violation: `Added ${target.name} to (${typeNames[type]})`, punishment: '—', color: COLORS.success, guild: interaction.guild });
      return interaction.reply({ embeds: [replyEmbed({ color: COLORS.success, title: '✅ Added', description: `> ${target.name} added to **${typeNames[type]}**.` })], ephemeral: true });
    }

    if (sub === 'remove') {
      const target = getTarget();
      if (target.error) return interaction.reply({ embeds: [replyEmbed({ color: COLORS.warn, title: '⚠️', description: `> ${target.error}` })], ephemeral: true });
      const key  = keyMap[type];
      const list = whitelist[key] || [];
      if (!list.includes(target.id)) return interaction.reply({ embeds: [replyEmbed({ color: COLORS.warn, title: '⚠️ Not Found', description: `> ${target.name} is not in **${typeNames[type]}**.` })], ephemeral: true });
      whitelist[key] = list.filter(id => id !== target.id);
      saveWhitelist();
      await sendLog({ type: 'whitelist', executor: `<@${interaction.user.id}>`, violation: `Removed ${target.name} from (${typeNames[type]})`, punishment: '—', color: COLORS.danger, guild: interaction.guild });
      return interaction.reply({ embeds: [replyEmbed({ color: COLORS.success, title: '✅ Removed', description: `> ${target.name} removed from **${typeNames[type]}**.` })], ephemeral: true });
    }

    if (sub === 'list') {
      const sections = [
        { key: 'users',         label: ' Full Whitelist (Users)',          mention: id => `<@${id}>` },
        { key: 'roles',         label: ' Full Whitelist (Roles)',           mention: id => `<@&${id}>` },
        { key: 'addBots',       label: ' Can Add Bots',                    mention: id => `<@${id}>` },
        { key: 'ban',           label: ' Can Ban',                         mention: id => `<@${id}>` },
        { key: 'channelDel',    label: '#️ Can Delete Channels (no limit)',   mention: id => `<@${id}>` },
        { key: 'webhookCreate', label: ' Can Create Webhooks',             mention: id => `<@${id}>` },
        { key: 'bots',          label: ' Allowed Bots',                    mention: id => `<@${id}>` },
      ];
      const desc = sections.map(s => {
        const list = whitelist[s.key] || [];
        return `**${s.label}**\n> ${list.length ? list.map(s.mention).join(' ') : '*empty*'}`;
      }).join('\n\n');
      return interaction.reply({ embeds: [replyEmbed({ color: COLORS.info, title: ' Full Whitelist', description: desc, footer: `by zwh. • Total users: ${whitelist.users.length}` })], ephemeral: true });
    }
  }
});

// =======================================
//   Auto Webhooks (room configs)
// =======================================
const state = {};

async function setupWebhook(channel, config, guildIconURL) {
  try {
    const existing = await channel.fetchWebhooks();
    let hook = existing.find(w => w.name === config.webhookName && w.owner?.id === client.user.id);
    if (!hook) { hook = await channel.createWebhook({ name: config.webhookName, avatar: guildIconURL || undefined }); console.log(`✅ Created webhook in #${channel.name}`); }
    else { await hook.edit({ avatar: guildIconURL || undefined }); }
    return hook;
  } catch (err) { console.error(`❌ Webhook setup failed in #${channel.name}: ${err.message}`); return null; }
}

client.on(Events.MessageCreate, async (msg) => {
  if (msg.author.bot) return;
  const rs = state[msg.channelId];
  if (!rs || !rs.hook) return;
  rs.counter++;
  if (rs.counter >= rs.config.every) {
    rs.counter = 0;
    if (rs.lastMessageId) { try { const old = await msg.channel.messages.fetch(rs.lastMessageId); await old.delete(); } catch {} }
    try {
      const sent = await rs.hook.send({ content: rs.config.message });
      rs.lastMessageId = sent.id;
    } catch (err) {
      if (err.code === 10015) {
        rs.hook = await setupWebhook(rs.channel, rs.config, rs.guild.iconURL({ extension: 'png', size: 256 }));
        if (rs.hook) { const sent = await rs.hook.send({ content: rs.config.message }); rs.lastMessageId = sent.id; }
      }
    }
  }
});

// =======================================
//   Ready
// =======================================
client.once(Events.ClientReady, async () => {
  console.log(`\n🤖 ${client.user.tag} — Online`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  await registerCommands();
  for (const config of roomConfigs) {
    try {
      const channel = await client.channels.fetch(config.channelId);
      if (!channel) { console.warn(`⚠️ Channel not found: ${config.channelId}`); continue; }
      const guild   = channel.guild;
      const hook    = await setupWebhook(channel, config, guild.iconURL({ extension: 'png', size: 256 }));
      state[config.channelId] = { counter: 0, lastMessageId: null, hook, config, channel, guild };
      console.log(`📌 #${channel.name} — every ${config.every} messages`);
    } catch (err) { console.error(`❌ ${err.message}`); }
  }
  console.log('\n✅ Protections:');
  console.log(`  ${PROTECTION.serverSettings ? '✅' : '❌'} Server Settings + Admin`);
  console.log(`  ${PROTECTION.antiRaid ? '✅' : '❌'} Anti-Raid — Bans:${LIMITS.bans} | Channels:${LIMITS.channelDeletes} | Roles:${LIMITS.roleDeletes}`);
  console.log(`  ${PROTECTION.antiBots ? '✅' : '❌'} Anti-Bots`);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

client.login(BOT_TOKEN);
