const { Client, GatewayIntentBits, Events } = require('discord.js');
 const http = require('http');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
// Keep-alive server عشان Render ما يوقف البوت
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('البوت شغّال ✅');
}).listen(PORT, () => {
  console.log(`🌐 Keep-alive server شغّال على port ${PORT}`);
});
 
// =============================================
//   إعدادات الرومات — عدّل هنا فقط
// =============================================
const roomConfigs = [
  {
    channelId: '1160272271806574753',
    message: '🔥**دراقون كانيلوني مجاني** <#1511469046506197084>',
    every: 1,
    webhookName: 'Ez shadow',
  },
  {
    channelId: '1160271731810906152',
    message: '🔥**دراقون كانيلوني مجاني** <#1511469046506197084>',
    every: 1,
    webhookName: 'Ez shadow',
  },
    {
    channelId: '1409582649487659152',
    message: '🔥**دراقون كانيلوني مجاني** <#1511469046506197084>',
    every: 1,
    webhookName: 'Ez shadow',
  },
    {
    channelId: '1465885721083777034',
    message: '🔥**دراقون كانيلوني مجاني** <#1511469046506197084>',
    every: 1,
    webhookName: 'Ez shadow',
  },
    { 
    channelId: '1401133375015747706',
    message: '🔥**دراقون كانيلوني مجاني** <#1511469046506197084>',
    every: 1,
    webhookName: 'Ez shadow',
  },
    {
    channelId: '1493332535365599303',
    message: '🔥**دراقون كانيلوني مجاني** <#1511469046506197084>',
    every: 1,
    webhookName: 'Ez shadow',
  },
    {
    channelId: '1461763814146965688',
    message: '🔥**دراقون كانيلوني مجاني** <#1511469046506197084>',
    every: 1,
    webhookName: 'Ez shadow',
  },
    {
    channelId: '1464024227761098896',
    message: '🔥**دراقون كانيلوني مجاني** <#1511469046506197084>',
    every: 1,
    webhookName: 'Ez shadow',
  },
    {
    channelId: '1461764244646268958',
    message: '🔥**دراقون كانيلوني مجاني** <#1511469046506197084>',
    every: 1,
    webhookName: 'Ez shadow',
  },
      {
    channelId: '1461764456634646538',
    message: '🔥**دراقون كانيلوني مجاني** <#1511469046506197084>',
    every: 1,
    webhookName: 'Ez shadow',
  },
      {
    channelId: '1507029588109168822',
    message: '🔥**دراقون كانيلوني مجاني** <#1511469046506197084>',
    every: 1,
    webhookName: 'Ez shadow',
  },
      {
    channelId: '1489362661543121078',
    message: '🔥**دراقون كانيلوني مجاني** <#1511469046506197084>',
    every: 1,
    webhookName: 'Ez shadow',
  },

];
// =============================================
 
const state = {};
 
async function setupWebhook(channel, config, guildIconURL) {
  try {
    const existingHooks = await channel.fetchWebhooks();
    let hook = existingHooks.find(w => w.name === config.webhookName && w.owner?.id === client.user.id);
 
    if (!hook) {
      hook = await channel.createWebhook({
        name: config.webhookName,
        avatar: guildIconURL || undefined,
        reason: 'بوت تلقائي — إنشاء ويبهوك',
      });
      console.log(`✅ تم إنشاء ويبهوك في #${channel.name} بصورة السيرفر`);
    } else {
      // حدّث صورة الويبهوك بصورة السيرفر الحالية
      await hook.edit({ avatar: guildIconURL || undefined });
      console.log(`♻️ تم تحديث صورة الويبهوك في #${channel.name}`);
    }
 
    return hook;
  } catch (err) {
    console.error(`❌ فشل إنشاء الويبهوك في #${channel.name}: ${err.message}`);
    return null;
  }
}
 
client.once(Events.ClientReady, async () => {
  console.log(`\n🤖 البوت شغّال — ${client.user.tag}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
 
  for (const config of roomConfigs) {
    try {
      const channel = await client.channels.fetch(config.channelId);
      if (!channel) {
        console.warn(`⚠️ ما لقى الروم: ${config.channelId}`);
        continue;
      }
 
      // جيب صورة السيرفر تلقائياً
      const guild = channel.guild;
      const guildIconURL = guild.iconURL({ extension: 'png', size: 256 });
 
      if (guildIconURL) {
        console.log(`🖼️ صورة السيرفر "${guild.name}": ${guildIconURL}`);
      } else {
        console.log(`⚠️ السيرفر "${guild.name}" ما عنده صورة`);
      }
 
      const hook = await setupWebhook(channel, config, guildIconURL);
 
      state[config.channelId] = {
        counter: 0,
        lastMessageId: null,
        hook,
        config,
        channel,
        guild,
      };
 
      console.log(`📌 جاهز — #${channel.name} | كل ${config.every} رسايل\n`);
    } catch (err) {
      console.error(`❌ خطأ في إعداد الروم ${config.channelId}: ${err.message}`);
    }
  }
 
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ كل الرومات جاهزة — البوت يراقب الآن\n');
});
 
client.on(Events.MessageCreate, async (msg) => {
  if (msg.author.bot) return;
 
  const roomState = state[msg.channelId];
  if (!roomState || !roomState.hook) return;
 
  roomState.counter++;
  console.log(`💬 رسالة في #${msg.channel.name} — العداد: ${roomState.counter}/${roomState.config.every}`);
 
  if (roomState.counter >= roomState.config.every) {
    roomState.counter = 0;
 
    // احذف الرسالة القديمة
    if (roomState.lastMessageId) {
      try {
        const oldMsg = await msg.channel.messages.fetch(roomState.lastMessageId);
        await oldMsg.delete();
        console.log(`🗑️ تم حذف الرسالة القديمة في #${msg.channel.name}`);
      } catch {
        // محذوفة يدوياً — مو مشكلة
      }
    }
 
    // أرسل عبر الويبهوك
    try {
      const sent = await roomState.hook.send({
        content: roomState.config.message,
      });
      roomState.lastMessageId = sent.id;
      console.log(`✉️ تم الإرسال في #${msg.channel.name} عبر الويبهوك\n`);
    } catch (err) {
      console.error(`❌ فشل الإرسال: ${err.message}`);
 
      // إذا انكسر الويبهوك سوّي جديد
      if (err.code === 10015) {
        console.log('🔄 الويبهوك انكسر — يتم إنشاء واحد جديد...');
        const guildIconURL = roomState.guild.iconURL({ extension: 'png', size: 256 });
        roomState.hook = await setupWebhook(roomState.channel, roomState.config, guildIconURL);
        if (roomState.hook) {
          const sent = await roomState.hook.send({ content: roomState.config.message });
          roomState.lastMessageId = sent.id;
        }
      }
    }
  }
});
 
// ضع توكن البوت هنا
client.login('MTUxMTUwOTk2MDMzNTQyNTYyNg.GPAvb7.3LM1mxx2hnPLd3H-Gv3axhPS39w6Rv6zBYGUAw');
