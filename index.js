const {
  Client, GatewayIntentBits, Events, AuditLogEvent,
  PermissionsBitField, REST, Routes, SlashCommandBuilder,
  EmbedBuilder,
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

// أضف أي أونر إضافي هنا
const BOT_OWNER_IDS  = ['1224722940701048927','710530455908384829','1242554088818999440'];
const BOT_TOKEN      = process.env.BOT_TOKEN || 'MTUxMTUwOTk2MDMzNTQyNTYyNg.GPAvb7.3LM1mxx2hnPLd3H-Gv3axhPS39w6Rv6zBYGUAw';
const CLIENT_ID      = '1511509960335425626';
const LOG_CHANNEL_ID = '1513261574012407858';

// ======= بوتات الطرف الثالث =======
// أضف ID البرو بوت هنا — لما يعطي رتبة نبحث عن الشخص الحقيقي بالاسم من الـ reason
const PROXY_BOTS = [
  // '123456789012345678', // Pro Bot ID
];

const roomConfigs = [
  { channelId: '1160272271806574753', message: '🔥** 3 الاف روبوكس مجاني** <#1513236872153792682>', delayMs: 60000, webhookName: 'Ez shadow' },
  { channelId: '1160271731810906152', message: '🔥** 3 الاف روبوكس مجاني** <#1513236872153792682>', delayMs: 60000, webhookName: 'Ez shadow' },
  { channelId: '1409582649487659152', message: '🔥** 3 الاف روبوكس مجاني** <#1513236872153792682>', delayMs: 60000, webhookName: 'Ez shadow' },
  { channelId: '1465885721083777034', message: '🔥** 3 الاف روبوكس مجاني** <#1513236872153792682>', delayMs: 60000, webhookName: 'Ez shadow' },
  { channelId: '1401133375015747706', message: '🔥** 3 الاف روبوكس مجاني** <#1513236872153792682>', delayMs: 60000, webhookName: 'Ez shadow' },
  { channelId: '1461763814146965688', message: '🔥** 3 الاف روبوكس مجاني** <#1513236872153792682>', delayMs: 60000, webhookName: 'Ez shadow' },
  { channelId: '1464024227761098896', message: '🔥** 3 الاف روبوكس مجاني** <#1513236872153792682>', delayMs: 60000, webhookName: 'Ez shadow' },
  { channelId: '1461764244646268958', message: '🔥** 3 الاف روبوكس مجاني** <#1513236872153792682>', delayMs: 60000, webhookName: 'Ez shadow' },
  { channelId: '1461764456634646538', message: '🔥** 3 الاف روبوكس مجاني** <#1513236872153792682>', delayMs: 60000, webhookName: 'Ez shadow' },
  { channelId: '1507029588109168822', message: '🔥** 3 الاف روبوكس مجاني** <#1513236872153792682>', delayMs: 60000, webhookName: 'Ez shadow' },
  { channelId: '1489362661543121078', message: '🔥** 3 الاف روبوكس مجاني** <#1513236872153792682>', delayMs: 60000, webhookName: 'Ez shadow' },
];

const PROTECTION = { serverSettings: true, antiRaid: false, antiBots: true, botRoleProtect: true };
const LIMITS     = { bans: 10, channelDeletes: 2, roleDeletes: 2, massbanWindow: 10000, massbanCount: 5 };

// ======= الإيموجيات =======
const LOG_EMOJIS = [
  '<:by_ez_137:1514763870198173797>',
  '<:13PaimonThink:1491152797280895118>',
  '<:by_ez_38:1473583670496596019>',
  '<a:by_ez_37:1514646707923718241>',
  '<a:ezshadow:1355368577829441697>',
];
function getRandLogEmoji() {
  return LOG_EMOJIS[Math.floor(Math.random() * LOG_EMOJIS.length)];
}

// ======= Advanced Whitelist =======
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

function isWhitelisted(userId, memberRoles = []) {
  if (BOT_OWNER_IDS.includes(userId)) return true;
  if (whitelist.users.includes(userId)) return true;
  if (memberRoles.some(r => whitelist.roles.includes(r))) return true;
  return false;
}
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

// ======= Stats — محفوظة في ملف دائم =======
const STATS_FILE = './stats.json';
function getToday() { return new Date().toISOString().split('T')[0]; }
function loadStats() {
  try { return JSON.parse(fs.readFileSync(STATS_FILE, 'utf8')); } catch { return {}; }
}
function saveStats() {
  try { fs.writeFileSync(STATS_FILE, JSON.stringify(dailyActions, null, 2)); } catch {}
}
let dailyActions = loadStats();

function incrementCount(userId, action) {
  const t = getToday();
  if (!dailyActions[userId]) dailyActions[userId] = {};
  if (!dailyActions[userId][t]) dailyActions[userId][t] = {};
  dailyActions[userId][t][action] = (dailyActions[userId][t][action] || 0) + 1;
  saveStats();
  return dailyActions[userId][t][action];
}
function getCount(userId, action) {
  const t = getToday();
  return dailyActions[userId]?.[t]?.[action] || 0;
}

// ======= Colors =======
const COLORS = { danger: 0xE24B4A, warn: 0xFAA61A, success: 0x57C97A, info: 0x5865F2 };

// ======= سجل الأحداث — محفوظ في ملف دائم =======
const EVENTS_LOG_FILE = './events.log';
function writeEventLog(type, executor, violation, punishment) {
  // نظّف الـ mentions من النص لأن الـ log ملف نصي
  const clean = s => String(s).replace(/<[^>]+>/g, '').trim();
  const line = `[${new Date().toISOString()}] [${type}] executor=${clean(executor)} | violation=${clean(violation)} | punishment=${clean(punishment)}\n`;
  try { fs.appendFileSync(EVENTS_LOG_FILE, line); } catch (err) { console.error('❌ Log write failed:', err.message); }
}

// ======= Log embed builder =======
function buildLogMessage({ type, executor, violation, punishment, extra = [], color = COLORS.danger }) {
  const e1 = getRandLogEmoji();
  const e2 = getRandLogEmoji();
  const e3 = getRandLogEmoji();

  const titles = {
    ban:        `${e1} تبنيد عضو`,        serverEdit: `${e1} تغيير إعدادات السيرفر`,
    adminRole:  `${e1} إعطاء صلاحية Administrator`, channelDel: `${e1} حذف روم`,
    roleDel:    `${e1} حذف رتبة`,         botAdd:     `${e1} إضافة بوت غير مصرح`,
    whitelist:  `${e1} تعديل الوايت ليست`, webhook:   `${e1} إنشاء ويبهوك`,
    kick:       `${e1} طرد عضو`,           botRoleMod:`${e1} تعديل صلاحيات رتبة البوت`,
    massban:    `${e1} ماس بان — إيقاف فوري`, proxyRole:`${e1} إعطاء رتبة عبر بوت وسيط`,
  };
  const typeLabels = {
    ban:        '🔴 تبنيد',   serverEdit: '🔴 تغيير السيرفر', adminRole: '🔴 صلاحية Admin',
    channelDel: '🟡 حذف روم', roleDel:    '🟡 حذف رتبة',      botAdd:    '🔴 بوت غير مصرح',
    whitelist:  '🟢 وايت ليست', webhook:  '🟡 ويبهوك',        kick:      '🟡 طرد',
    botRoleMod: '🔴 تعديل رتبة البوت',    massban:   '🔴 ماس بان', proxyRole: '🔴 رتبة عبر بوت',
  };

  const desc = [
    `${e2} **المنفّذ**`, `> ${executor || 'غير معروف'}`, '',
    `${e3} **المخالفة**`, `> ${violation || '—'}`, '',
    `⚠️ **العقوبة**`, `> ${punishment || '—'}`,
  ];
  if (extra.length) extra.forEach(e => desc.push('', `**${e.name}**`, `> ${e.value}`));

  // احفظ في الملف
  writeEventLog(type, executor, violation, punishment);

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

async function getAuditEntry(guild, auditAction, targetId = null) {
  try {
    await new Promise(r => setTimeout(r, 500));
    const logs  = await guild.fetchAuditLogs({ limit: 1, type: auditAction });
    const entry = logs.entries.first();
    if (!entry) return null;
    if (targetId && entry.target?.id !== targetId) return null;
    return entry;
  } catch { return null; }
}
async function getAuditUser(guild, auditAction, targetId = null) {
  const entry = await getAuditEntry(guild, auditAction, targetId);
  return entry?.executor || null;
}

// ======= استخراج الشخص الحقيقي من الـ reason (للبرو بوت) =======
// الفورمات: "With reason By: Username" — نبحث عن الشخص باليوزرنيم في أعضاء السيرفر
async function extractRealExecutorFromReason(reason, guild) {
  if (!reason) return null;

  // فورمات "By: ID" — لو موجود ID مباشرة
  const matchId = reason.match(/By:\s*(\d{17,20})/i);
  if (matchId) return matchId[1];

  // فورمات "<@ID>"
  const matchMention = reason.match(/<@!?(\d{17,20})>/);
  if (matchMention) return matchMention[1];

  // فورمات "By: Username" — نبحث في أعضاء السيرفر
  const matchName = reason.match(/By:\s*([^\s|،,]+)/i);
  if (matchName) {
    const name = matchName[1].trim().toLowerCase();
    try {
      // نفتش في الكاش أول
      let found = guild.members.cache.find(m =>
        m.user.username.toLowerCase() === name ||
        (m.nickname && m.nickname.toLowerCase() === name) ||
        m.user.globalName?.toLowerCase() === name
      );
      // لو ما لقيناه نجيب الأعضاء من الـ API
      if (!found) {
        const fetched = await guild.members.search({ query: name, limit: 5 });
        found = fetched.find(m =>
          m.user.username.toLowerCase() === name ||
          (m.nickname && m.nickname.toLowerCase() === name) ||
          m.user.globalName?.toLowerCase() === name
        );
      }
      if (found) return found.id;
    } catch {}
  }
  return null;
}

// ======= Reply embed builder =======
function replyEmbed({ color, title, description, fields = [], footer = 'by zwh.' }) {
  return new EmbedBuilder()
    .setColor(color).setTitle(title).setDescription(description).addFields(fields)
    .setThumbnail(client.user.displayAvatarURL())
    .setFooter({ text: footer, iconURL: client.user.displayAvatarURL() })
    .setTimestamp();
}

// =======================================
//   Register slash commands
// =======================================
async function registerCommands() {
  const wlTypes = [
    { name: 'Full Whitelist — User',       value: 'user' },
    { name: 'Full Whitelist — Role',        value: 'role' },
    { name: 'Whitelist — Add Bots',         value: 'addBots' },
    { name: 'Whitelist — Ban',              value: 'ban' },
    { name: '#️Whitelist — Channel Delete', value: 'channelDel' },
    { name: 'Whitelist — Webhook Create',   value: 'webhookCreate' },
    { name: 'Whitelist — Specific Bot',     value: 'bots' },
  ];

  const commands = [
    new SlashCommandBuilder()
      .setName('whitelist').setDescription('Manage the advanced whitelist')
      .addSubcommand(s => s.setName('add').setDescription('Add a user or role to the whitelist')
        .addStringOption(o => o.setName('type').setDescription('Whitelist type').setRequired(true).addChoices(...wlTypes))
        .addUserOption(o => o.setName('user').setDescription('User or bot'))
        .addRoleOption(o => o.setName('role').setDescription('Role')))
      .addSubcommand(s => s.setName('remove').setDescription('Remove from the whitelist')
        .addStringOption(o => o.setName('type').setDescription('Whitelist type').setRequired(true).addChoices(...wlTypes))
        .addUserOption(o => o.setName('user').setDescription('User or bot'))
        .addRoleOption(o => o.setName('role').setDescription('Role')))
      .addSubcommand(s => s.setName('list').setDescription('View the full whitelist'))
      .toJSON(),

    new SlashCommandBuilder()
      .setName('protection').setDescription('Manage bot protections')
      .addSubcommand(s => s.setName('status').setDescription('View protection status'))
      .addSubcommand(s => s.setName('toggle').setDescription('Enable or disable a protection')
        .addStringOption(o => o.setName('type').setDescription('Protection type').setRequired(true).addChoices(
          { name: 'Server Settings + Admin', value: 'serverSettings' },
          { name: 'Anti-Raid',               value: 'antiRaid' },
          { name: 'Anti-Bots',               value: 'antiBots' },
          { name: 'Bot Role Protect',         value: 'botRoleProtect' },
        ))
        .addBooleanOption(o => o.setName('enabled').setDescription('Enable or disable').setRequired(true)))
      .addSubcommand(s => s.setName('limits').setDescription('Edit daily action limits')
        .addIntegerOption(o => o.setName('bans').setDescription('Daily ban limit').setMinValue(1))
        .addIntegerOption(o => o.setName('channels').setDescription('Channel delete limit').setMinValue(1))
        .addIntegerOption(o => o.setName('roles').setDescription('Role delete limit').setMinValue(1))
        .addIntegerOption(o => o.setName('massban').setDescription('Mass ban count trigger (per 10s)').setMinValue(2)))
      .toJSON(),

    new SlashCommandBuilder().setName('restart').setDescription('Restart the bot process').toJSON(),

    new SlashCommandBuilder()
      .setName('logs').setDescription('Show recent protection events')
      .addIntegerOption(o => o.setName('count').setDescription('Number of events (default 10, max 30)').setMinValue(1).setMaxValue(30))
      .toJSON(),

    new SlashCommandBuilder().setName('stats').setDescription('Show today protection statistics').toJSON(),

    new SlashCommandBuilder()
      .setName('unban').setDescription('Unban a user by ID')
      .addStringOption(o => o.setName('user_id').setDescription('User ID to unban').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason for unban'))
      .toJSON(),

    new SlashCommandBuilder()
      .setName('webhooks').setDescription('Manage webhooks')
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
  await sendLog({ type: 'serverEdit', executor: `<@${executor.id}>`, violation: 'Changed server settings without permission', punishment: '🔨 بان دائم', color: COLORS.danger });
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

  const entry = await getAuditEntry(newMember.guild, AuditLogEvent.MemberRoleUpdate, newMember.id);
  if (!entry) return;
  const executor = entry.executor;
  if (!executor || executor.id === client.user.id) return;

  // ======= تتبع البرو بوت — نبحث عن الشخص الحقيقي بالاسم =======
  let realExecutorId = executor.id;
  let viaProxy = false;
  if (executor.bot && PROXY_BOTS.includes(executor.id)) {
    const foundId = await extractRealExecutorFromReason(entry.reason, newMember.guild);
    if (foundId) {
      realExecutorId = foundId;
      viaProxy = true;
    }
  }

  const roles = await getMemberRoles(newMember.guild, realExecutorId);
  if (isWhitelisted(realExecutorId, roles)) return;

  const extraInfo = viaProxy
    ? [{ name: '🤖 نُفِّذ عبر بوت', value: `<@${executor.id}> — الشخص الحقيقي: <@${realExecutorId}>` }]
    : [];

  await sendLog({
    type: viaProxy ? 'proxyRole' : 'adminRole',
    executor: `<@${realExecutorId}>`,
    violation: `أعطى رتبة **${dangerRole.name}** (Admin) لـ <@${newMember.id}>${viaProxy ? ` عبر <@${executor.id}>` : ''}`,
    punishment: '🔨 بان دائم + سحب الرتبة',
    extra: extraInfo,
    color: COLORS.danger,
  });

  memberRoleCooldown.add(newMember.id);
  setTimeout(() => memberRoleCooldown.delete(newMember.id), 5000);
  try { await newMember.roles.remove(dangerRole); } catch {}
  await punish(newMember.guild, realExecutorId, 'Gave Administrator role without permission');
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
  await sendLog({ type: 'adminRole', executor: `<@${executor.id}>`, violation: `Added Administrator permission to role **${newRole.name}**`, punishment: 'بان + استعادة الصلاحيات', color: COLORS.danger });
  roleUpdateCooldown.add(newRole.id);
  setTimeout(() => roleUpdateCooldown.delete(newRole.id), 5000);
  try { await newRole.setPermissions(oldRole.permissions); } catch {}
  await punish(newRole.guild, executor.id, 'Added Administrator to a role');
});

// =======================================
//   Protection — Bot Role Protect
// =======================================
client.on(Events.GuildRoleUpdate, async (oldRole, newRole) => {
  if (!PROTECTION.botRoleProtect) return;
  const botMember = newRole.guild.members.cache.get(client.user.id);
  if (!botMember) return;
  if (!botMember.roles.cache.has(newRole.id)) return;
  if (oldRole.permissions.bitfield === newRole.permissions.bitfield) return;
  const executor = await getAuditUser(newRole.guild, AuditLogEvent.RoleUpdate, newRole.id);
  if (!executor || executor.id === client.user.id) return;
  const roles = await getMemberRoles(newRole.guild, executor.id);
  if (isWhitelisted(executor.id, roles)) return;
  await sendLog({ type: 'botRoleMod', executor: `<@${executor.id}>`, violation: `Tried to modify bot's role **${newRole.name}** permissions`, punishment: ' بان فوري + استعادة الصلاحيات', color: COLORS.danger });
  try { await newRole.setPermissions(oldRole.permissions); } catch {}
  await punish(newRole.guild, executor.id, 'Modified bot role permissions');
});

// =======================================
//   Protection 2 — Anti-Raid
// =======================================
client.on(Events.ChannelDelete, async (channel) => {
  if (!PROTECTION.antiRaid || !channel.guild) return;
  const executor = await getAuditUser(channel.guild, AuditLogEvent.ChannelDelete, channel.id);
  if (!executor) return;
  const roles = await getMemberRoles(channel.guild, executor.id);
  if (hasSpecificWL(executor.id, roles, 'channelDel')) return;
  const count = incrementCount(executor.id, 'channelDeletes');
  const over  = count >= LIMITS.channelDeletes;
  await sendLog({ type: 'channelDel', executor: `<@${executor.id}>`, violation: `Deleted **${channel.name}** — ${count}/${LIMITS.channelDeletes}`, punishment: over ? 'بان' : `⚠️ تحذير — ${LIMITS.channelDeletes - count} متبقية`, color: over ? COLORS.danger : COLORS.warn });
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
  await sendLog({ type: 'roleDel', executor: `<@${executor.id}>`, violation: `Deleted role **${role.name}** — ${count}/${LIMITS.roleDeletes}`, punishment: over ? 'بان' : `⚠️ تحذير — ${LIMITS.roleDeletes - count} متبقية`, color: over ? COLORS.danger : COLORS.warn });
  if (over) await punish(role.guild, executor.id, `Exceeded role delete limit (${LIMITS.roleDeletes}/day)`);
});

// ======= Anti-Mass Ban =======
const recentBans = {};
client.on(Events.GuildAuditLogEntryCreate, async (entry, guild) => {
  if (!PROTECTION.antiRaid) return;
  if (entry.action !== AuditLogEvent.MemberBanAdd) return;
  const executor = entry.executor;
  if (!executor || executor.id === client.user.id) return;
  const roles = await getMemberRoles(guild, executor.id);
  if (hasSpecificWL(executor.id, roles, 'ban')) return;

  const now = Date.now();
  const dailyCount = incrementCount(executor.id, 'bans');

  if (!recentBans[executor.id]) recentBans[executor.id] = [];
  recentBans[executor.id].push(now);
  recentBans[executor.id] = recentBans[executor.id].filter(t => now - t <= LIMITS.massbanWindow);
  const recentCount = recentBans[executor.id].length;

  if (recentCount >= LIMITS.massbanCount) {
    await sendLog({ type: 'massban', executor: `<@${executor.id}>`, violation: `Mass ban — ${recentCount} bans in ${LIMITS.massbanWindow / 1000}s`, punishment: '🔨 بان فوري', color: COLORS.danger });
    recentBans[executor.id] = [];
    await punish(guild, executor.id, `Mass ban (${recentCount} in ${LIMITS.massbanWindow / 1000}s)`);
    return;
  }

  const over = dailyCount >= LIMITS.bans;
  await sendLog({ type: 'ban', executor: `<@${executor.id}>`, violation: `Banned <@${entry.target?.id}> — ${dailyCount}/${LIMITS.bans}`, punishment: over ? '👢 طرد' : `⚠️ تحذير — ${LIMITS.bans - dailyCount} متبقية`, color: COLORS.warn });
  if (over) await kick(guild, executor.id, `Exceeded daily ban limit (${LIMITS.bans}/day)`);
});

// =======================================
//   Protection 3 — Anti-Bots
// =======================================
client.on(Events.GuildMemberAdd, async (member) => {
  if (!PROTECTION.antiBots || !member.user.bot) return;
  if (whitelist.bots.includes(member.id)) return;
  const executor = await getAuditUser(member.guild, AuditLogEvent.BotAdd, member.id);
  const roles = executor ? await getMemberRoles(member.guild, executor.id) : [];
  if (executor && hasSpecificWL(executor.id, roles, 'addBots')) return;
  await sendLog({ type: 'botAdd', executor: executor ? `<@${executor.id}>` : 'غير معروف', violation: `Added bot <@${member.id}> without permission`, punishment: 'بان البوت + بان المضيف', color: COLORS.danger });
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
    if (hasSpecificWL(executor.id, roles, 'webhookCreate')) return;
    const hooks   = await channel.fetchWebhooks();
    const newHook = hooks.find(h => h.owner?.id === executor.id);
    await sendLog({ type: 'webhook', executor: `<@${executor.id}>`, violation: `Created webhook in <#${channel.id}>`, punishment: 'بان + حذف الويبهوك', color: COLORS.danger });
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
    if (!BOT_OWNER_IDS.includes(interaction.user.id)) {
      await interaction.reply({ ephemeral: true, embeds: [replyEmbed({ color: COLORS.danger, title: '🚫 Access Denied', description: '> This command is for bot owners only.' })] });
      return false;
    }
    return true;
  };

  // ===================== /restart =====================
  if (interaction.commandName === 'restart') {
    if (!await ownerOnly()) return;
    await interaction.reply({ embeds: [replyEmbed({ color: COLORS.warn, title: '🔄 Restarting...', description: '> البوت رح يعيد التشغيل هلأ.' })] });
    console.log(`🔄 Restart requested by ${interaction.user.tag}`);
    setTimeout(() => process.exit(0), 1500);
    return;
  }

  // ===================== /logs =====================
  if (interaction.commandName === 'logs') {
    if (!await ownerOnly()) return;
    await interaction.deferReply({ ephemeral: true });
    const count = interaction.options.getInteger('count') || 10;
    try {
      if (!fs.existsSync(EVENTS_LOG_FILE)) {
        return interaction.editReply({ embeds: [replyEmbed({ color: COLORS.info, title: ' Logs', description: '> لا يوجد سجل أحداث بعد.' })] });
      }
      const raw   = fs.readFileSync(EVENTS_LOG_FILE, 'utf8').trim().split('\n').filter(Boolean);
      const lines = raw.slice(-count).reverse();
      if (!lines.length) return interaction.editReply({ embeds: [replyEmbed({ color: COLORS.info, title: ' Logs', description: '> السجل فارغ.' })] });

      const formatted = lines.map((l, i) => {
        const match = l.match(/^\[(.+?)\] \[(.+?)\] executor=(.+?) \| violation=(.+?) \| punishment=(.+)$/);
        if (!match) return `\`${l.slice(0, 80)}\``;
        const [, ts, type, exec, viol] = match;
        const time = `<t:${Math.floor(new Date(ts).getTime() / 1000)}:R>`;
        return `**${i + 1}.** \`${type}\` ${time}\n> 👤 ${exec}\n> 📌 ${viol.slice(0, 80)}`;
      });

      const chunks = []; let cur = '';
      for (const l of formatted) {
        if ((cur + '\n\n' + l).length > 3800) { chunks.push(cur); cur = l; } else cur = cur ? cur + '\n\n' + l : l;
      }
      if (cur) chunks.push(cur);

      return interaction.editReply({ embeds: chunks.map((c, i) => replyEmbed({ color: COLORS.info, title: i === 0 ? ` آخر ${lines.length} أحداث` : '​', description: c })) });
    } catch (err) {
      return interaction.editReply({ embeds: [replyEmbed({ color: COLORS.danger, title: '❌ Error', description: `> ${err.message}` })] });
    }
  }

  // ===================== /stats =====================
  if (interaction.commandName === 'stats') {
    if (!await ownerOnly()) return;
    const today = getToday();
    // أعد قراءة الـ stats من الملف للتأكد من آخر البيانات
    dailyActions = loadStats();
    let totalBans = 0, totalKicks = 0, totalChannelDel = 0, totalRoleDel = 0;
    for (const uid of Object.keys(dailyActions)) {
      totalBans       += dailyActions[uid]?.[today]?.bans           || 0;
      totalKicks      += dailyActions[uid]?.[today]?.kicks          || 0;
      totalChannelDel += dailyActions[uid]?.[today]?.channelDeletes || 0;
      totalRoleDel    += dailyActions[uid]?.[today]?.roleDeletes    || 0;
    }
    let totalEvents = 0;
    try {
      if (fs.existsSync(EVENTS_LOG_FILE))
        totalEvents = fs.readFileSync(EVENTS_LOG_FILE, 'utf8').trim().split('\n').filter(Boolean).length;
    } catch {}

    return interaction.reply({ ephemeral: true, embeds: [replyEmbed({ color: COLORS.info, title: 'ش إحصائيات اليوم', description: [
      `**التاريخ:** \`${today}\``, '',
      `**بانات اليوم:** \`${totalBans}\``,
      `**طرد اليوم:** \`${totalKicks}\``,
      `**حذف روم:** \`${totalChannelDel}\``,
      `**ذ حذف رتبة:** \`${totalRoleDel}\``, '',
      `** إجمالي الأحداث المسجلة:** \`${totalEvents}\``,
    ].join('\n') })] });
  }

  // ===================== /unban =====================
  if (interaction.commandName === 'unban') {
    if (!await ownerOnly()) return;
    await interaction.deferReply({ ephemeral: true });
    const userId = interaction.options.getString('user_id').trim();
    const reason = interaction.options.getString('reason') || 'Manual unban by owner';
    try {
      await interaction.guild.members.unban(userId, reason);
      await sendLog({ type: 'whitelist', executor: `<@${interaction.user.id}>`, violation: `Unbanned user \`${userId}\``, punishment: `✅ رُفع البان — ${reason}`, color: COLORS.success });
      return interaction.editReply({ embeds: [replyEmbed({ color: COLORS.success, title: '✅ Unbanned', description: `> تم رفع البان عن \`${userId}\`.\n> **السبب:** ${reason}` })] });
    } catch (err) {
      return interaction.editReply({ embeds: [replyEmbed({ color: COLORS.danger, title: '❌ Error', description: `> فشل رفع البان: ${err.message}` })] });
    }
  }

  // ===================== /webhooks =====================
  if (interaction.commandName === 'webhooks') {
    if (!await ownerOnly()) return;
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });

    if (sub === 'list') {
      try {
        const all = await interaction.guild.fetchWebhooks();
        if (!all.size) return interaction.editReply({ embeds: [replyEmbed({ color: COLORS.info, title: '🪝 Webhooks', description: '> No webhooks found.' })] });
        const lines = all.map(w => {
          const ch = w.channelId ? `<#${w.channelId}>` : 'Unknown';
          const ow = w.owner ? `<@${w.owner.id}>` : 'Unknown';
          const mine = w.owner?.id === client.user.id ? ' *(bot)*' : '';
          return `**${w.name}${mine}**\n> 📌 ${ch}\n> 👤 ${ow}\n> 🔑 \`${w.id}\``;
        });
        const chunks = []; let cur = '';
        for (const l of lines) { if ((cur + '\n\n' + l).length > 3800) { chunks.push(cur); cur = l; } else cur = cur ? cur + '\n\n' + l : l; }
        if (cur) chunks.push(cur);
        return interaction.editReply({ embeds: chunks.map((c, i) => replyEmbed({ color: COLORS.info, title: i === 0 ? `🪝 Webhooks (${all.size})` : '​', description: c })) });
      } catch (err) {
        return interaction.editReply({ embeds: [replyEmbed({ color: COLORS.danger, title: '❌ Error', description: `${err.message}` })] });
      }
    }
    if (sub === 'delete') {
      const hookId = interaction.options.getString('id');
      try {
        const hook = await interaction.guild.fetchWebhooks().then(h => h.get(hookId));
        if (!hook) return interaction.editReply({ embeds: [replyEmbed({ color: COLORS.warn, title: '⚠️ Not Found', description: '> No webhook found with that ID.' })] });
        await hook.delete('Manual deletion by owner');
        return interaction.editReply({ embeds: [replyEmbed({ color: COLORS.success, title: '✅ Deleted', description: `> Webhook **${hook.name}** deleted.` })] });
      } catch (err) {
        return interaction.editReply({ embeds: [replyEmbed({ color: COLORS.danger, title: '❌ Error', description: `${err.message}` })] });
      }
    }
  }

  // ===================== /protection =====================
  if (interaction.commandName === 'protection') {
    if (!await ownerOnly()) return;
    const sub = interaction.options.getSubcommand();

    if (sub === 'status') {
      const s = v => v ? '✅ Enabled' : '❌ Disabled';
      return interaction.reply({ ephemeral: true, embeds: [replyEmbed({ color: COLORS.info, title: 'Protection Status', description: [
        `**Server Settings**`, `> ${s(PROTECTION.serverSettings)}`, '',
        `**Anti-Raid**`, `> ${s(PROTECTION.antiRaid)} — Bans: \`${LIMITS.bans}/day\` | Mass: \`${LIMITS.massbanCount}/${LIMITS.massbanWindow/1000}s\` | Ch: \`${LIMITS.channelDeletes}\` | Roles: \`${LIMITS.roleDeletes}\``, '',
        `**Anti-Bots**`, `> ${s(PROTECTION.antiBots)}`, '',
        `**Bot Role Protect**`, `> ${s(PROTECTION.botRoleProtect)}`,
      ].join('\n') })] });
    }
    if (sub === 'toggle') {
      const type    = interaction.options.getString('type');
      const enabled = interaction.options.getBoolean('enabled');
      const names   = { serverSettings: 'Server Settings + Admin', antiRaid: 'Anti-Raid', antiBots: 'Anti-Bots', botRoleProtect: 'Bot Role Protect' };
      PROTECTION[type] = enabled;
      return interaction.reply({ ephemeral: true, embeds: [replyEmbed({ color: enabled ? COLORS.success : COLORS.danger, title: enabled ? '✅ Enabled' : '❌ Disabled', description: `> **${names[type]}** is now ${enabled ? 'enabled' : 'disabled'}.` })] });
    }
    if (sub === 'limits') {
      const bans    = interaction.options.getInteger('bans');
      const ch      = interaction.options.getInteger('channels');
      const rl      = interaction.options.getInteger('roles');
      const massban = interaction.options.getInteger('massban');
      const changes = [];
      if (bans    != null) { LIMITS.bans           = bans;    changes.push(`Bans/day: \`${bans}\``); }
      if (ch      != null) { LIMITS.channelDeletes = ch;      changes.push(`Channels: \`${ch}\``); }
      if (rl      != null) { LIMITS.roleDeletes    = rl;      changes.push(`Roles: \`${rl}\``); }
      if (massban != null) { LIMITS.massbanCount   = massban; changes.push(`Mass Ban: \`${massban}/${LIMITS.massbanWindow/1000}s\``); }
      if (!changes.length) return interaction.reply({ ephemeral: true, embeds: [replyEmbed({ color: COLORS.warn, title: '⚠️', description: '> No values provided.' })] });
      return interaction.reply({ ephemeral: true, embeds: [replyEmbed({ color: COLORS.success, title: '✅ Limits Updated', description: `> ${changes.join(' — ')}` })] });
    }
  }

  // ===================== /whitelist =====================
  if (interaction.commandName === 'whitelist') {
    if (!await ownerOnly()) return;
    const sub  = interaction.options.getSubcommand();
    const type = interaction.options.getString('type');
    const keyMap   = { user:'users', role:'roles', addBots:'addBots', ban:'ban', channelDel:'channelDel', webhookCreate:'webhookCreate', bots:'bots' };
    const typeNames = { user:'Full Whitelist (User)', role:'Full Whitelist (Role)', addBots:'Add Bots Whitelist', ban:'Ban Whitelist', channelDel:'Channel Delete Whitelist', webhookCreate:'Webhook Create Whitelist', bots:'Specific Bot Whitelist' };

    const getTarget = () => {
      const user = interaction.options.getUser('user');
      const role = interaction.options.getRole('role');
      if (type === 'role') { if (!role) return { error: 'يجب تحديد **رتبة**.' }; return { id: role.id, name: `<@&${role.id}>` }; }
      if (type === 'bots') { if (!user) return { error: 'يجب تحديد **بوت**.' }; return { id: user.id, name: `<@${user.id}>` }; }
      if (user) return { id: user.id, name: `<@${user.id}>` };
      if (role) return { id: role.id, name: `<@&${role.id}>` };
      return { error: 'يجب تحديد **شخص** أو **رتبة**.' };
    };

    if (sub === 'add') {
      const target = getTarget();
      if (target.error) return interaction.reply({ ephemeral: true, embeds: [replyEmbed({ color: COLORS.warn, title: '⚠️', description: `> ${target.error}` })] });
      const key = keyMap[type]; const list = whitelist[key] || [];
      if (list.includes(target.id)) return interaction.reply({ ephemeral: true, embeds: [replyEmbed({ color: COLORS.warn, title: '⚠️ Already Exists', description: `> ${target.name} is already in **${typeNames[type]}**.` })] });
      whitelist[key] = [...list, target.id]; saveWhitelist();
      await sendLog({ type: 'whitelist', executor: `<@${interaction.user.id}>`, violation: `Added ${target.name} to (${typeNames[type]})`, punishment: '—', color: COLORS.success });
      return interaction.reply({ ephemeral: true, embeds: [replyEmbed({ color: COLORS.success, title: '✅ Added', description: `> ${target.name} added to **${typeNames[type]}**.` })] });
    }
    if (sub === 'remove') {
      const target = getTarget();
      if (target.error) return interaction.reply({ ephemeral: true, embeds: [replyEmbed({ color: COLORS.warn, title: '⚠️', description: `> ${target.error}` })] });
      const key = keyMap[type]; const list = whitelist[key] || [];
      if (!list.includes(target.id)) return interaction.reply({ ephemeral: true, embeds: [replyEmbed({ color: COLORS.warn, title: '⚠️ Not Found', description: `> ${target.name} is not in **${typeNames[type]}**.` })] });
      whitelist[key] = list.filter(id => id !== target.id); saveWhitelist();
      await sendLog({ type: 'whitelist', executor: `<@${interaction.user.id}>`, violation: `Removed ${target.name} from (${typeNames[type]})`, punishment: '—', color: COLORS.danger });
      return interaction.reply({ ephemeral: true, embeds: [replyEmbed({ color: COLORS.success, title: '✅ Removed', description: `> ${target.name} removed from **${typeNames[type]}**.` })] });
    }
    if (sub === 'list') {
      const sections = [
        { key:'users', label:'Full Whitelist (Users)', mention: id => `<@${id}>` },
        { key:'roles', label:'Full Whitelist (Roles)', mention: id => `<@&${id}>` },
        { key:'addBots', label:'Can Add Bots', mention: id => `<@${id}>` },
        { key:'ban', label:'Can Ban', mention: id => `<@${id}>` },
        { key:'channelDel', label:'Can Delete Channels', mention: id => `<@${id}>` },
        { key:'webhookCreate', label:'Can Create Webhooks', mention: id => `<@${id}>` },
        { key:'bots', label:'Allowed Bots', mention: id => `<@${id}>` },
      ];
      const desc = sections.map(s => { const l = whitelist[s.key] || []; return `**${s.label}**\n> ${l.length ? l.map(s.mention).join(' ') : '*empty*'}`; }).join('\n\n');
      return interaction.reply({ ephemeral: true, embeds: [replyEmbed({ color: COLORS.info, title: '📋 Full Whitelist', description: desc, footer: `by zwh. • Total users: ${whitelist.users.length}` })] });
    }
  }
});

// =======================================
//   Auto Webhooks — ديلاي ساعة بين كل رسالة
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

async function deletePreviousMessage(rs) {
  if (!rs.lastMessageId) return;
  const idToDelete = rs.lastMessageId;
  rs.lastMessageId = null;
  try { const old = await rs.channel.messages.fetch(idToDelete); await old.delete(); } catch {}
}

async function sendWebhookMessage(rs) {
  if (rs.sending) return;
  rs.sending = true;
  try {
    await deletePreviousMessage(rs);
    let sent = null;
    try {
      sent = await rs.hook.send({ content: rs.config.message });
    } catch (err) {
      if (err.code === 10015) {
        rs.hook = await setupWebhook(rs.channel, rs.config, rs.guild.iconURL({ extension: 'png', size: 256 }));
        if (rs.hook) sent = await rs.hook.send({ content: rs.config.message });
      }
    }
    if (sent) rs.lastMessageId = sent.id;
  } finally {
    rs.sending = false;
  }
}

function startChannelTimer(channelId) {
  const rs = state[channelId];
  if (!rs) return;
  // أرسل الرسالة الأولى فوراً عند البدء
  sendWebhookMessage(rs);
  // ثم كل ساعة
  rs.timer = setInterval(() => sendWebhookMessage(rs), rs.config.delayMs);
  console.log(`⏱️ #${rs.channel.name} — every ${rs.config.delayMs / 60000} min`);
}

// =======================================
//   Ready
// =======================================
client.once(Events.ClientReady, async () => {
  const presences = [
    { name: '𝒃𝒚 𝒛𝒘𝒉.', type: 0 },
    { name: 'discord.gg/ez1 ', type: 3 },
    { name: 'hello', type: 3 },
    { name: '𝒃𝒚 𝒛𝒘𝒉.', type: 2 },
  ];
  let presenceIndex = 0;
  const setPresence = () => { client.user.setPresence({ status: 'dnd', activities: [presences[presenceIndex++ % presences.length]] }); };
  setPresence();
  setInterval(setPresence, 15_000);

  console.log(`\n🤖 ${client.user.tag} — Online`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  await registerCommands();

  for (const config of roomConfigs) {
    try {
      const channel = await client.channels.fetch(config.channelId);
      if (!channel) { console.warn(`⚠️ Channel not found: ${config.channelId}`); continue; }
      const guild = channel.guild;
      const hook  = await setupWebhook(channel, config, guild.iconURL({ extension: 'png', size: 256 }));
      state[config.channelId] = { lastMessageId: null, sending: false, timer: null, hook, config, channel, guild };
      startChannelTimer(config.channelId);
    } catch (err) { console.error(`❌ ${err.message}`); }
  }

  console.log('\n✅ Protections:');
  console.log(`  ${PROTECTION.serverSettings ? '✅' : '❌'} Server Settings + Admin`);
  console.log(`  ${PROTECTION.antiRaid       ? '✅' : '❌'} Anti-Raid — Bans:${LIMITS.bans}/day | Mass:${LIMITS.massbanCount}/${LIMITS.massbanWindow/1000}s | Ch:${LIMITS.channelDeletes} | Roles:${LIMITS.roleDeletes}`);
  console.log(`  ${PROTECTION.antiBots       ? '✅' : '❌'} Anti-Bots`);
  console.log(`  ${PROTECTION.botRoleProtect ? '✅' : '❌'} Bot Role Protect`);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

client.login(BOT_TOKEN);
