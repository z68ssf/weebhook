const { Client, GatewayIntentBits, Events, AuditLogEvent, PermissionsBitField, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const http = require('http');
const fs = require('fs');
 
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent,
  ],
});
 
const PORT = process.env.PORT || 3001;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('البوت شغّال ✅');
}).listen(PORT, () => {
  console.log(`🌐 Keep-alive server شغّال على port ${PORT}`);
});
 
// =============================================
const BOT_OWNER_ID   = '1224722940701048927';
const BOT_TOKEN      = process.env.BOT_TOKEN || 'MTUxMTUwOTk2MDMzNTQyNTYyNg.GPAvb7.3LM1mxx2hnPLd3H-Gv3axhPS39w6Rv6zBYGUAw';
const CLIENT_ID      = '1511509960335425626';
const LOG_CHANNEL_ID = '1513261574012407858';
 
const roomConfigs = [
  { channelId: '1160272271806574753', message: '🔥**دراقون كانيلوني مجاني** <#1511469046506197084>', every: 1, webhookName: 'Ez shadow' },
  { channelId: '1160271731810906152', message: '🔥**دراقون كانيلوني مجاني** <#1511469046506197084>', every: 1, webhookName: 'Ez shadow' },
  { channelId: '1409582649487659152', message: '🔥**دراقون كانيلوني مجاني** <#1511469046506197084>', every: 1, webhookName: 'Ez shadow' },
  { channelId: '1465885721083777034', message: '🔥**دراقون كانيلوني مجاني** <#1511469046506197084>', every: 1, webhookName: 'Ez shadow' },
  { channelId: '1401133375015747706', message: '🔥**دراقون كانيلوني مجاني** <#1511469046506197084>', every: 1, webhookName: 'Ez shadow' },
  { channelId: '1493332535365599303', message: '🔥**دراقون كانيلوني مجاني** <#1511469046506197084>', every: 1, webhookName: 'Ez shadow' },
  { channelId: '1461763814146965688', message: '🔥**دراقون كانيلوني مجاني** <#1511469046506197084>', every: 1, webhookName: 'Ez shadow' },
  { channelId: '1464024227761098896', message: '🔥**دراقون كانيلوني مجاني** <#1511469046506197084>', every: 1, webhookName: 'Ez shadow' },
  { channelId: '1461764244646268958', message: '🔥**دراقون كانيلوني مجاني** <#1511469046506197084>', every: 1, webhookName: 'Ez shadow' },
  { channelId: '1461764456634646538', message: '🔥**دراقون كانيلوني مجاني** <#1511469046506197084>', every: 1, webhookName: 'Ez shadow' },
  { channelId: '1507029588109168822', message: '🔥**دراقون كانيلوني مجاني** <#1511469046506197084>', every: 1, webhookName: 'Ez shadow' },
  { channelId: '1489362661543121078', message: '🔥**دراقون كانيلوني مجاني** <#1511469046506197084>', every: 1, webhookName: 'Ez shadow' },
];
 
const PROTECTION = { serverSettings: true, antiRaid: false, antiBots: true };
const LIMITS = { bans: 10, channelDeletes: 2, roleDeletes: 2 };
// =============================================
 
const E = {
  ghost: '<:001:1367537609512976446>',
  dot:   '<a:Goku_black:1367537723912622202>',
};
 
// ======= وايت ليست =======
const WL_FILE = './whitelist.json';
function loadWhitelist() { try { return JSON.parse(fs.readFileSync(WL_FILE, 'utf8')); } catch { return []; } }
function saveWhitelist(list) { fs.writeFileSync(WL_FILE, JSON.stringify(list, null, 2)); }
let whitelist = loadWhitelist();
function isWhitelisted(userId) { return userId === BOT_OWNER_ID || whitelist.includes(userId); }
 
// ======= عداد يومي =======
const dailyActions = {};
function getToday() { return new Date().toISOString().split('T')[0]; }
function incrementCount(userId, action) {
  const t = getToday();
  if (!dailyActions[userId]) dailyActions[userId] = {};
  if (!dailyActions[userId][t]) dailyActions[userId][t] = {};
  dailyActions[userId][t][action] = (dailyActions[userId][t][action] || 0) + 1;
  return dailyActions[userId][t][action];
}
 
// ======= اللوق =======
async function sendLog({ type, executor, violation, punishment, extra = [], color = 0xE24B4A }) {
  try {
    const channel = await client.channels.fetch(LOG_CHANNEL_ID);
    if (!channel) return;
    const titles = {
      ban: 'تبنيد عضو', serverEdit: 'تغيير إعدادات السيرفر', adminRole: 'إعطاء صلاحية Administrator',
      channelDel: 'حذف روم', roleDel: 'حذف رتبة', botAdd: 'إضافة بوت غير مصرح',
      whitelist: 'تعديل الوايت ليست', webhook: 'إرسال ويبهوك', kick: 'طرد عضو',
    };
    const fields = [];
    if (executor)   fields.push({ name: `${E.dot} المخالف`,  value: executor,   inline: false });
    if (violation)  fields.push({ name: `${E.dot} المخالفة`, value: violation,  inline: false });
    if (punishment) fields.push({ name: `${E.dot} العقوبة`,  value: punishment, inline: false });
    fields.push(...extra);
    const embed = new EmbedBuilder()
      .setColor(color)
      .setAuthor({ name: `${E.ghost}  ${titles[type] || type}`, iconURL: client.user.displayAvatarURL() })
      .addFields(fields)
      .setTimestamp()
      .setFooter({ text: 'by zwh.', iconURL: client.user.displayAvatarURL() });
    await channel.send({ embeds: [embed] });
  } catch (err) { console.error(`❌ فشل إرسال اللوق: ${err.message}`); }
}
 
// ======= بان =======
async function punish(guild, userId, reason) {
  try {
    await guild.members.ban(userId, { reason: `حماية تلقائية: ${reason}` });
    console.log(`${E.dot} تم تبنيد ${userId} — ${reason}`);
    await sendLog({ type: 'ban', executor: `<@${userId}>`, violation: reason, punishment: `${E.ghost} بان دائم`, color: 0xE24B4A });
  } catch (err) { console.error(`❌ فشل البان: ${err.message}`); }
}
 
// ======= طرد (بدل البان لتجاوز حد البان) =======
async function kick(guild, userId, reason) {
  try {
    const member = await guild.members.fetch(userId);
    await member.kick(`حماية تلقائية: ${reason}`);
    console.log(`👢 تم طرد ${userId} — ${reason}`);
    await sendLog({ type: 'kick', executor: `<@${userId}>`, violation: reason, punishment: `👢 طرد من السيرفر`, color: 0xFAA61A });
  } catch (err) { console.error(`❌ فشل الطرد: ${err.message}`); }
}
 
// ======= أوديت لوق =======
async function getAuditUser(guild, auditAction, targetId = null) {
  try {
    await new Promise(r => setTimeout(r, 500));
    const logs = await guild.fetchAuditLogs({ limit: 1, type: auditAction });
    const entry = logs.entries.first();
    if (!entry) return null;
    if (targetId && entry.target?.id !== targetId) return null;
    return entry.executor;
  } catch { return null; }
}
 
// =======================================
//   سجّل السلاش كوماند
// =======================================
async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('whitelist').setDescription('إدارة الوايت ليست')
      .addSubcommand(s => s.setName('add').setDescription('أضف شخص').addUserOption(o => o.setName('user').setDescription('الشخص').setRequired(true)))
      .addSubcommand(s => s.setName('remove').setDescription('أزل شخص').addUserOption(o => o.setName('user').setDescription('الشخص').setRequired(true)))
      .addSubcommand(s => s.setName('list').setDescription('عرض الوايت ليست'))
      .toJSON(),
    new SlashCommandBuilder()
      .setName('protection').setDescription('إدارة حمايات البوت')
      .addSubcommand(s => s.setName('status').setDescription('عرض حالة الحمايات'))
      .addSubcommand(s => s.setName('toggle').setDescription('تفعيل أو تعطيل حماية')
        .addStringOption(o => o.setName('type').setDescription('نوع الحماية').setRequired(true)
          .addChoices(
            { name: 'حماية إعدادات السيرفر + Admin', value: 'serverSettings' },
            { name: 'حماية ضد الرايد', value: 'antiRaid' },
            { name: 'حماية ضد البوتات', value: 'antiBots' },
          ))
        .addBooleanOption(o => o.setName('enabled').setDescription('تفعيل أو تعطيل').setRequired(true)))
      .toJSON(),
    new SlashCommandBuilder()
      .setName('webhooks').setDescription('عرض كل الويبهوكات في السيرفر')
      .toJSON(),
  ];
  const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✅ تم تسجيل السلاش كوماندات');
  } catch (err) { console.error(`❌ فشل تسجيل الأوامر: ${err.message}`); }
}
 
// =======================================
//   حماية 1 — إعدادات السيرفر + Admin
// =======================================
const guildUpdateCooldown = new Set();
client.on(Events.GuildUpdate, async (oldGuild, newGuild) => {
  if (!PROTECTION.serverSettings) return;
  if (guildUpdateCooldown.has(newGuild.id)) return;
  const changed = oldGuild.name !== newGuild.name || oldGuild.icon !== newGuild.icon || oldGuild.banner !== newGuild.banner || oldGuild.vanityURLCode !== newGuild.vanityURLCode;
  if (!changed) return;
  const executor = await getAuditUser(newGuild, AuditLogEvent.GuildUpdate);
  if (!executor || executor.id === client.user.id || isWhitelisted(executor.id)) return;
  await sendLog({ type: 'serverEdit', executor: `<@${executor.id}>`, violation: 'تغيير إعدادات السيرفر بدون صلاحية', punishment: `${E.ghost} بان دائم`, color: 0xE24B4A });
  guildUpdateCooldown.add(newGuild.id);
  setTimeout(() => guildUpdateCooldown.delete(newGuild.id), 5000);
  await punish(newGuild, executor.id, 'تغيير إعدادات السيرفر');
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
  if (!executor || executor.id === client.user.id || isWhitelisted(executor.id)) return;
  await sendLog({ type: 'adminRole', executor: `<@${executor.id}>`, violation: `إعطاء رتبة **${dangerRole.name}** لـ <@${newMember.id}> وهي تحتوي على Administrator`, punishment: `${E.ghost} بان دائم + سحب الرتبة`, color: 0xE24B4A });
  memberRoleCooldown.add(newMember.id);
  setTimeout(() => memberRoleCooldown.delete(newMember.id), 5000);
  try { await newMember.roles.remove(dangerRole); } catch {}
  await punish(newMember.guild, executor.id, 'إعطاء رتبة Administrator بدون صلاحية');
});
 
const roleUpdateCooldown = new Set();
client.on(Events.GuildRoleUpdate, async (oldRole, newRole) => {
  if (!PROTECTION.serverSettings) return;
  if (roleUpdateCooldown.has(newRole.id)) return;
  const hadAdmin = oldRole.permissions.has(PermissionsBitField.Flags.Administrator);
  const hasAdmin = newRole.permissions.has(PermissionsBitField.Flags.Administrator);
  if (hadAdmin || !hasAdmin) return;
  const executor = await getAuditUser(newRole.guild, AuditLogEvent.RoleUpdate, newRole.id);
  if (!executor || executor.id === client.user.id || isWhitelisted(executor.id)) return;
  await sendLog({ type: 'adminRole', executor: `<@${executor.id}>`, violation: `إضافة صلاحية Administrator لرتبة **${newRole.name}**`, punishment: `${E.ghost} بان دائم + استعادة صلاحيات الرتبة`, color: 0xE24B4A });
  roleUpdateCooldown.add(newRole.id);
  setTimeout(() => roleUpdateCooldown.delete(newRole.id), 5000);
  try { await newRole.setPermissions(oldRole.permissions); } catch {}
  await punish(newRole.guild, executor.id, 'إضافة صلاحية Administrator لرتبة');
});
 
// =======================================
//   حماية 2 — ضد الريد
// =======================================
client.on(Events.ChannelDelete, async (channel) => {
  if (!PROTECTION.antiRaid || !channel.guild) return;
  const executor = await getAuditUser(channel.guild, AuditLogEvent.ChannelDelete, channel.id);
  if (!executor || isWhitelisted(executor.id)) return;
  const count = incrementCount(executor.id, 'channelDeletes');
  await sendLog({ type: 'channelDel', executor: `<@${executor.id}>`, violation: `حذف روم **${channel.name}** — العداد: ${count}/${LIMITS.channelDeletes}`, punishment: count >= LIMITS.channelDeletes ? `${E.ghost} بان دائم` : `⚠️ تحذير — ${LIMITS.channelDeletes - count} متبقية`, color: count >= LIMITS.channelDeletes ? 0xE24B4A : 0xFAA61A });
  if (count >= LIMITS.channelDeletes) await punish(channel.guild, executor.id, `تجاوز حد حذف الرومات (${LIMITS.channelDeletes}/يوم)`);
});
 
client.on(Events.GuildRoleDelete, async (role) => {
  if (!PROTECTION.antiRaid) return;
  const executor = await getAuditUser(role.guild, AuditLogEvent.RoleDelete, role.id);
  if (!executor || isWhitelisted(executor.id)) return;
  const count = incrementCount(executor.id, 'roleDeletes');
  await sendLog({ type: 'roleDel', executor: `<@${executor.id}>`, violation: `حذف رتبة **${role.name}** — العداد: ${count}/${LIMITS.roleDeletes}`, punishment: count >= LIMITS.roleDeletes ? `${E.ghost} بان دائم` : `⚠️ تحذير — ${LIMITS.roleDeletes - count} متبقية`, color: count >= LIMITS.roleDeletes ? 0xE24B4A : 0xFAA61A });
  if (count >= LIMITS.roleDeletes) await punish(role.guild, executor.id, `تجاوز حد حذف الرولات (${LIMITS.roleDeletes}/يوم)`);
});
 
// حماية البان اليومي — طرد بدل بان
client.on(Events.GuildAuditLogEntryCreate, async (entry, guild) => {
  if (!PROTECTION.antiRaid) return;
  if (entry.action !== AuditLogEvent.MemberBanAdd) return;
  const executor = entry.executor;
  if (!executor) return;
  if (executor.id === client.user.id) return;
  if (isWhitelisted(executor.id)) return;
 
  const count = incrementCount(executor.id, 'bans');
  await sendLog({
    type: 'ban',
    executor: `<@${executor.id}>`,
    violation: `بان <@${entry.target?.id}> — العداد: ${count}/${LIMITS.bans}`,
    punishment: count >= LIMITS.bans ? `👢 طرد من السيرفر` : `⚠️ تحذير — ${LIMITS.bans - count} متبقية`,
    color: count >= LIMITS.bans ? 0xFAA61A : 0xFAA61A,
  });
 
  // طرد بدل بان لما يتجاوز الحد
  if (count >= LIMITS.bans)
    await kick(guild, executor.id, `تجاوز حد البان اليومي (${LIMITS.bans}/يوم)`);
});
 
// =======================================
//   حماية 3 — ضد البوتات
// =======================================
client.on(Events.GuildMemberAdd, async (member) => {
  if (!PROTECTION.antiBots || !member.user.bot) return;
  const executor = await getAuditUser(member.guild, AuditLogEvent.BotAdd, member.id);
  await sendLog({ type: 'botAdd', executor: executor ? `<@${executor.id}>` : 'غير معروف', violation: `إضافة بوت <@${member.id}> بدون إذن`, punishment: `${E.ghost} بان البوت + بان المضيف`, color: 0xE24B4A });
  await punish(member.guild, member.id, 'إضافة بوت غير مصرح');
  if (executor && !isWhitelisted(executor.id)) await punish(member.guild, executor.id, 'إضافة بوت غير مصرح');
});
 
// =======================================
//   الإنتراكشنز
// =======================================
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
 
  const ownerOnly = async () => {
    if (interaction.user.id !== BOT_OWNER_ID) {
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(0xE24B4A).setAuthor({ name: `${E.ghost}  خطأ في الصلاحيات`, iconURL: client.user.displayAvatarURL() }).setDescription('> هذا الأمر مخصص للمالك فقط.').setTimestamp().setFooter({ text: 'by zwh.', iconURL: client.user.displayAvatarURL() })] });
      return false;
    }
    return true;
  };
 
  // ======= /webhooks =======
  if (interaction.commandName === 'webhooks') {
    if (!await ownerOnly()) return;
    await interaction.deferReply();
    try {
      const allWebhooks = await interaction.guild.fetchWebhooks();
      if (!allWebhooks.size) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setAuthor({ name: `${E.ghost}  الويبهوكات`, iconURL: client.user.displayAvatarURL() }).setDescription('> لا يوجد ويبهوكات في السيرفر.').setTimestamp().setFooter({ text: 'by zwh.', iconURL: client.user.displayAvatarURL() })] });
      const lines = allWebhooks.map(w => {
        const ch = w.channelId ? `<#${w.channelId}>` : 'غير معروف';
        const ow = w.owner ? `<@${w.owner.id}>` : 'غير معروف';
        const mine = w.owner?.id === client.user.id ? ` ${E.ghost}` : '';
        return `**${w.name}${mine}**\n> ${E.dot} الروم: ${ch}\n> ${E.dot} المنشئ: ${ow}\n> ${E.dot} \`${w.id}\``;
      });
      const chunks = []; let current = '';
      for (const line of lines) { if ((current + '\n\n' + line).length > 3900) { chunks.push(current); current = line; } else current = current ? current + '\n\n' + line : line; }
      if (current) chunks.push(current);
      return interaction.editReply({ embeds: chunks.map((chunk, i) => new EmbedBuilder().setColor(0x5865F2).setAuthor(i === 0 ? { name: `${E.ghost}  الويبهوكات (${allWebhooks.size})`, iconURL: client.user.displayAvatarURL() } : { name: '​' }).setDescription(chunk).setTimestamp().setFooter({ text: 'by zwh.', iconURL: client.user.displayAvatarURL() })) });
    } catch (err) { return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xE24B4A).setDescription(`❌ فشل جلب الويبهوكات: ${err.message}`)] }); }
  }
 
  // ======= /protection =======
  if (interaction.commandName === 'protection') {
    if (!await ownerOnly()) return;
    const sub = interaction.options.getSubcommand();
    if (sub === 'status') {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setAuthor({ name: `${E.ghost}  حالة الحمايات`, iconURL: client.user.displayAvatarURL() }).addFields([
        { name: `${E.dot} إعدادات السيرفر + Admin`, value: PROTECTION.serverSettings ? '✅ مفعّل' : '❌ معطّل', inline: false },
        { name: `${E.dot} ضد الرايد`, value: PROTECTION.antiRaid ? `✅ مفعّل — بان: ${LIMITS.bans} | رومات: ${LIMITS.channelDeletes} | رولات: ${LIMITS.roleDeletes}` : '❌ معطّل', inline: false },
        { name: `${E.dot} ضد البوتات`, value: PROTECTION.antiBots ? '✅ مفعّل' : '❌ معطّل', inline: false },
      ]).setTimestamp().setFooter({ text: 'by zwh.', iconURL: client.user.displayAvatarURL() })] });
    }
    if (sub === 'toggle') {
      const type = interaction.options.getString('type');
      const enabled = interaction.options.getBoolean('enabled');
      const names = { serverSettings: 'إعدادات السيرفر + Admin', antiRaid: 'ضد الرايد', antiBots: 'ضد البوتات' };
      PROTECTION[type] = enabled;
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(enabled ? 0x57c97a : 0xE24B4A).setAuthor({ name: `${E.ghost}  تم ${enabled ? 'تفعيل' : 'تعطيل'} الحماية`, iconURL: client.user.displayAvatarURL() }).addFields([
        { name: `${E.dot} الحماية`, value: names[type], inline: false },
        { name: `${E.dot} الحالة`, value: enabled ? '✅ مفعّل' : '❌ معطّل', inline: false },
      ]).setTimestamp().setFooter({ text: 'by zwh.', iconURL: client.user.displayAvatarURL() })] });
    }
  }
 
  // ======= /whitelist =======
  if (interaction.commandName === 'whitelist') {
    if (!await ownerOnly()) return;
    const sub = interaction.options.getSubcommand();
    if (sub === 'add') {
      const target = interaction.options.getUser('user');
      if (whitelist.includes(target.id)) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xFAA61A).setAuthor({ name: `${E.ghost}  تنبيه`, iconURL: client.user.displayAvatarURL() }).setDescription(`> **${target.tag}** موجود في الوايت ليست بالفعل.`).setTimestamp().setFooter({ text: 'by zwh.', iconURL: client.user.displayAvatarURL() })] });
      whitelist.push(target.id); saveWhitelist(whitelist);
      await sendLog({ type: 'whitelist', executor: `<@${interaction.user.id}>`, violation: `إضافة <@${target.id}> للوايت ليست`, punishment: '—', color: 0x57c97a });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x57c97a).setAuthor({ name: `${E.ghost}  تم بنجاح`, iconURL: client.user.displayAvatarURL() }).setDescription(`> تمت إضافة **${target.tag}** للوايت ليست.`).setTimestamp().setFooter({ text: 'by zwh.', iconURL: client.user.displayAvatarURL() })] });
    }
    if (sub === 'remove') {
      const target = interaction.options.getUser('user');
      if (!whitelist.includes(target.id)) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xFAA61A).setAuthor({ name: `${E.ghost}  تنبيه`, iconURL: client.user.displayAvatarURL() }).setDescription(`> **${target.tag}** غير موجود في الوايت ليست.`).setTimestamp().setFooter({ text: 'by zwh.', iconURL: client.user.displayAvatarURL() })] });
      whitelist = whitelist.filter(id => id !== target.id); saveWhitelist(whitelist);
      await sendLog({ type: 'whitelist', executor: `<@${interaction.user.id}>`, violation: `إزالة <@${target.id}> من الوايت ليست`, punishment: '—', color: 0xE24B4A });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x57c97a).setAuthor({ name: `${E.ghost}  تم بنجاح`, iconURL: client.user.displayAvatarURL() }).setDescription(`> تمت إزالة **${target.tag}** من الوايت ليست.`).setTimestamp().setFooter({ text: 'by zwh.', iconURL: client.user.displayAvatarURL() })] });
    }
    if (sub === 'list') {
      if (!whitelist.length) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setAuthor({ name: `${E.ghost}  الوايت ليست`, iconURL: client.user.displayAvatarURL() }).setDescription('> الوايت ليست فارغة حالياً.').setTimestamp().setFooter({ text: 'by zwh.', iconURL: client.user.displayAvatarURL() })] });
      const list = whitelist.map((id, i) => `${i + 1}. <@${id}>`).join('\n');
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setAuthor({ name: `${E.ghost}  الوايت ليست`, iconURL: client.user.displayAvatarURL() }).setDescription(list).setTimestamp().setFooter({ text: `by zwh. • إجمالي: ${whitelist.length} شخص`, iconURL: client.user.displayAvatarURL() })] });
    }
  }
});
 
// =======================================
//   ويبهوكات
// =======================================
const state = {};
 
async function setupWebhook(channel, config, guildIconURL) {
  try {
    const existingHooks = await channel.fetchWebhooks();
    let hook = existingHooks.find(w => w.name === config.webhookName && w.owner?.id === client.user.id);
    if (!hook) { hook = await channel.createWebhook({ name: config.webhookName, avatar: guildIconURL || undefined }); console.log(`✅ تم إنشاء ويبهوك في #${channel.name}`); }
    else { await hook.edit({ avatar: guildIconURL || undefined }); }
    return hook;
  } catch (err) { console.error(`❌ فشل الويبهوك في #${channel.name}: ${err.message}`); return null; }
}
 
client.on(Events.MessageCreate, async (msg) => {
  if (msg.author.bot) return;
  const roomState = state[msg.channelId];
  if (!roomState || !roomState.hook) return;
  roomState.counter++;
  console.log(`💬 #${msg.channel.name} — ${roomState.counter}/${roomState.config.every}`);
  if (roomState.counter >= roomState.config.every) {
    roomState.counter = 0;
    if (roomState.lastMessageId) { try { const oldMsg = await msg.channel.messages.fetch(roomState.lastMessageId); await oldMsg.delete(); } catch {} }
    try {
      const sent = await roomState.hook.send({ content: roomState.config.message });
      roomState.lastMessageId = sent.id;
      console.log(`✉️ تم الإرسال في #${msg.channel.name}`);
    } catch (err) {
      if (err.code === 10015) {
        const iconURL = roomState.guild.iconURL({ extension: 'png', size: 256 });
        roomState.hook = await setupWebhook(roomState.channel, roomState.config, iconURL);
        if (roomState.hook) { const sent = await roomState.hook.send({ content: roomState.config.message }); roomState.lastMessageId = sent.id; }
      }
    }
  }
});
 
client.once(Events.ClientReady, async () => {
  console.log(`\n🤖 البوت شغّال — ${client.user.tag}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  await registerCommands();
  for (const config of roomConfigs) {
    try {
      const channel = await client.channels.fetch(config.channelId);
      if (!channel) { console.warn(`⚠️ ما لقى الروم: ${config.channelId}`); continue; }
      const guild = channel.guild;
      const iconURL = guild.iconURL({ extension: 'png', size: 256 });
      const hook = await setupWebhook(channel, config, iconURL);
      state[config.channelId] = { counter: 0, lastMessageId: null, hook, config, channel, guild };
      console.log(`📌 جاهز — #${channel.name} | كل ${config.every} رسايل`);
    } catch (err) { console.error(`❌ خطأ: ${err.message}`); }
  }
  console.log('\n✅ الحمايات:');
  console.log(`  ${PROTECTION.serverSettings ? '✅' : '❌'} إعدادات السيرفر + Admin`);
  console.log(`  ${PROTECTION.antiRaid ? '✅' : '❌'} ضد الرليد — بان:${LIMITS.bans}(طرد) | رومات:${LIMITS.channelDeletes}(بان) | رولات:${LIMITS.roleDeletes}(بان)`);
  console.log(`  ${PROTECTION.antiBots ? '✅' : '❌'} ضد البوتات`);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});
 
client.login(BOT_TOKEN);
