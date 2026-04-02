const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    Events,
    MessageFlags // Yeni uyarıyı çözmek için eklendi
} = require('discord.js');
const axios = require('axios');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const bootTime = new Date();
const SERVER_CODE    = process.env.SERVER_CODE;
const SERVER_LABEL   = process.env.SERVER_LABEL ?? 'Sunucu';
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const FIVEM_API      = 'https://servers-frontend.fivem.net/api/servers/single/';

const COLOR_GOLD   = 0xC9A84C;
const COLOR_RED    = 0xD4380D;
const COLOR_LOG    = 0x1a1a2e;
const COLOR_PANEL  = 0x2C3E50;
const COLOR_GREEN  = 0x2ECC71;

client.once(Events.ClientReady, () => {
    console.log(`✅ Bot Aktif: ${client.user.tag}`);
    const restartSaati = bootTime.getHours().toString().padStart(2, '0') + ":" + 
                         bootTime.getMinutes().toString().padStart(2, '0');

    client.user.setPresence({
        activities: [{ name: `.gg/wellxsd | Son Res: ${restartSaati}` }],
        status: 'online',
    });
});

// TÜM KOMUTLAR TEK BİR MESSAGE_CREATE İÇİNDE OLMALI
client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;
    const msg = message.content.toLowerCase();

    // !idsorgu
    if (msg.startsWith('!idsorgu')) {
        const panelEmbed = new EmbedBuilder()
            .setColor(COLOR_PANEL)
            .setAuthor({ name: 'Sheriff Departmanı', iconURL: 'https://cdn.discordapp.com/emojis/1488193317752672358.png' })
            .setTitle('<:member_list_icon:1488195069298085929> Oyuncu Sorgu Paneli')
            .setDescription('> Aşağıdaki butonlardan birini seçin.\n\n**<:icons_id98:1488195005741924362> ID Sorgu**\n> Sunucu ID numarasıyla oyuncu ara\n\n**<:name_tag6:1488195090500550686> İsim Sorgu**\n> Oyuncu adıyla arama yap\n\n**<a:loading_dots:1488195048473493685> Sunucu Durumu**\n> Anlık sunucu bilgilerini görüntüle')
            .setFooter({ text: '𝗪𝗘𝗟𝗟𝗚𝗨𝗡𝗦𝗗 İ𝗗 𝗦𝖝𝗥𝗚𝗨 𝗕𝗢𝗧𝗨' }).setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('panel_id_sorgu').setLabel('ID Sorgu').setEmoji("<:icons_id98:1488195005741924362>").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('panel_isim_sorgu').setLabel(' Isim Sorgu').setEmoji('<:name_tag6:1488195090500550686>').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('panel_sunucu_durumu').setLabel('Sunucu Durumu').setEmoji("<:Blurple_Server:1488197856060768447>").setStyle(ButtonStyle.Success)
        );
        return message.channel.send({ embeds: [panelEmbed], components: [row] });
    }

    // !durum ve !durum2
    if (msg.startsWith('!durum ')) {
        const yeniMesaj = message.content.slice(7).trim();
        client.user.setActivity(yeniMesaj);
        return message.reply(`✅ Durum güncellendi: **${yeniMesaj}**`);
    }

    if (msg.startsWith('!durum2 ')) {
        const arg = message.content.slice(8).trim();
        const durumlar = { 'aktif': 'online', 'rahatsızetme': 'dnd', 'uyku': 'idle', 'görünmez': 'invisible' };
        if (durumlar[arg]) {
            client.user.setPresence({ status: durumlar[arg] });
            return message.reply(`✅ Simge **${arg}** oldu.`);
        }
    }

    // !mesaj ve !duyuru
    if (msg.startsWith('!mesaj ')) {
        const icerik = message.content.slice(7).trim();
        await message.delete().catch(() => {}); 
        return message.channel.send(icerik);
    }

    if (msg.startsWith('!duyuru ')) {
        const icerik = message.content.slice(8).trim();
        await message.delete().catch(() => {});
        const e = new EmbedBuilder().setColor(COLOR_GOLD).setAuthor({ name: '.gg/WELLXSD', iconURL: 'https://cdn.discordapp.com/emojis/1434613401895833770.webp' }).setDescription(`\n${icerik}\n`).setTimestamp();
        return message.channel.send({ embeds: [e] });
    }

    // !uptime
    if (msg === '!uptime') {
        const uptime = process.uptime();
        return message.reply(`🚀 Bot **${Math.floor(uptime/3600)} saat, ${Math.floor((uptime%3600)/60)} dakikadır** aktif.`);
    }

    // !ses [Kanal_ID] - ARTIK MESSAGE_CREATE İÇİNDE
    if (msg.startsWith('!ses ')) {
        const channelId = message.content.slice(5).trim();
        const channel = message.guild.channels.cache.get(channelId);
        if (!channel || channel.type !== 2) return message.reply('❌ Geçerli ses kanalı ID gir!');

        try {
            joinVoiceChannel({
                channelId: channel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
            });
            return message.reply(`✅ **${channel.name}** kanalına girildi!`);
        } catch (e) { return message.reply('❌ Ses hatası!'); }
    }

    if (msg === '!ses-cik') {
        const connection = getVoiceConnection(message.guild.id);
        if (connection) { connection.destroy(); return message.reply('👋 Çıkış yapıldı.'); }
    }
});

// ETKİLEŞİMLER
client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isButton()) {
        if (interaction.customId === 'panel_id_sorgu') {
            const modal = new ModalBuilder().setCustomId('modal_id_sorgu').setTitle('ID Sorgu');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('sorgu_deger').setLabel('ID Gir').setStyle(TextInputStyle.Short).setRequired(true)));
            return interaction.showModal(modal);
        }
        if (interaction.customId === 'panel_isim_sorgu') {
            const modal = new ModalBuilder().setCustomId('modal_isim_sorgu').setTitle('İsim Sorgu');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('sorgu_deger').setLabel('İsim Gir').setStyle(TextInputStyle.Short).setRequired(true)));
            return interaction.showModal(modal);
        }
        if (interaction.customId === 'panel_sunucu_durumu') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral }); // Yeni versiyon düzeltmesi
            try {
                const res = await axios.get(`${FIVEM_API}${SERVER_CODE}`);
                const data = res.data?.Data;
                const clients = data.clients;
                const max = data.sv_maxclients;
                const bar = '█'.repeat(Math.round((clients/max)*10)) + '░'.repeat(10-Math.round((clients/max)*10));
                const e = new EmbedBuilder().setColor(COLOR_GREEN).setTitle('Sunucu Durumu').addFields({ name: `Doluluk [${bar}]`, value: `%${Math.round((clients/max)*100)} dolu` }, { name: 'Oyuncu', value: `${clients}/${max}` }).setTimestamp();
                return interaction.editReply({ embeds: [e] });
            } catch { return interaction.editReply('Hata oluştu.'); }
        }
    }

    if (interaction.isModalSubmit()) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral }); // Yeni versiyon düzeltmesi
        const tip = interaction.customId === 'modal_id_sorgu' ? 'id' : 'isim';
        const deger = interaction.fields.getTextInputValue('sorgu_deger').trim();
        try {
            const res = await axios.get(`${FIVEM_API}${SERVER_CODE}`);
            const players = res.data?.Data?.players || [];
            const results = players.filter(p => tip === 'id' ? String(p.id) === deger : p.name.toLowerCase().includes(deger.toLowerCase()));
            if (!results.length) return interaction.editReply('Oyuncu bulunamadı.');
            const lines = results.map(p => `**${p.name}** (ID: ${p.id})`).join('\n');
            const e = new EmbedBuilder().setColor(COLOR_GOLD).setTitle('Sorgu Sonucu').setDescription(lines);
            await interaction.user.send({ embeds: [e] }).catch(() => {});
            return interaction.editReply('Sonuçlar DM gönderildi.');
        } catch { return interaction.editReply('Sorgu hatası.'); }
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);
