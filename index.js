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
    Events
} = require('discord.js');
const axios = require('axios');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice'); // SES İÇİN EKLENDİ
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates // SES YETKİSİ EKLENDİ
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

// ─────────────────────────────────────────
client.once(Events.ClientReady, () => {
    console.log(`✅ Bot Aktif: ${client.user.tag}`);
    
    const restartSaati = bootTime.getHours().toString().padStart(2, '0') + ":" + 
                         bootTime.getMinutes().toString().padStart(2, '0');

    client.user.setPresence({
        activities: [{ name: `.gg/wellxsd | Son Res: ${restartSaati}` }],
        status: 'online',
    });
});

// ─────────────────────────────────────────
//  MESAJ KOMUTLARI
// ─────────────────────────────────────────
client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;
    const msg = message.content.toLowerCase();

    // !idsorgu - Panel Gonder
    if (msg.startsWith('!idsorgu')) {
        const panelEmbed = new EmbedBuilder()
            .setColor(COLOR_PANEL)
            .setAuthor({
                name: 'Sheriff Departmanı',
                iconURL: 'https://cdn.discordapp.com/emojis/1488193317752672358.png'
            })
            .setTitle('<:member_list_icon:1488195069298085929> Oyuncu Sorgu Paneli')
            .setDescription(
                '> Aşağıdaki butonlardan birini seçin.\n\n' +
                '**<:icons_id98:1488195005741924362> ID Sorgu**\n' +
                '> Sunucu ID numarasıyla oyuncu ara\n\n' +
                '**<:name_tag6:1488195090500550686> İsim Sorgu**\n' +
                '> Oyuncu adıyla arama yap\n\n' +
                '**<a:loading_dots:1488195048473493685> Sunucu Durumu**\n' +
                '> Anlık sunucu bilgilerini görüntüle'
            )
            .setFooter({ text: '𝗪𝗘𝗟𝗟𝗚𝗨𝗡𝗦𝗗 İ𝗗 𝗦𝖝𝗥𝗚𝗨 𝗕𝗢𝗧𝗨' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('panel_id_sorgu').setLabel('ID Sorgu').setEmoji("<:icons_id98:1488195005741924362>").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('panel_isim_sorgu').setLabel(' Isim Sorgu').setEmoji('<:name_tag6:1488195090500550686>').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('panel_sunucu_durumu').setLabel('Sunucu Durumu').setEmoji("<:Blurple_Server:1488197856060768447>").setStyle(ButtonStyle.Success)
        );

        return message.channel.send({ embeds: [panelEmbed], components: [row] });
    }

    // !durum [mesaj]
    if (msg.startsWith('!durum ')) {
        const yeniMesaj = message.content.slice(7).trim();
        client.user.setActivity(yeniMesaj);
        return message.reply(`✅ Botun durumu güncellendi: **${yeniMesaj}**`);
    }

    // !durum2 [tip]
    if (msg.startsWith('!durum2 ')) {
        const arg = message.content.slice(8).trim();
        const durumlar = { 'aktif': 'online', 'rahatsızetme': 'dnd', 'uyku': 'idle', 'görünmez': 'invisible' };
        const secilen = durumlar[arg];
        if (!secilen) return message.reply('❌ Geçersiz tip!');
        
        client.user.setPresence({ status: secilen, activities: client.user.presence.activities });
        return message.reply(`✅ Çevrimiçi simgesi **${arg}** oldu.`);
    }

    // !mesaj [metin]
    if (msg.startsWith('!mesaj ')) {
        const icerik = message.content.slice(7).trim();
        await message.delete().catch(() => {}); 
        return message.channel.send(icerik);
    }

    // !duyuru [metin]
    if (msg.startsWith('!duyuru ')) {
        const icerik = message.content.slice(8).trim();
        await message.delete().catch(() => {});
        const duyuruEmbed = new EmbedBuilder()
            .setColor(COLOR_GOLD)
            .setAuthor({ name: '.gg/WELLXSD', iconURL: 'https://cdn.discordapp.com/emojis/1434613401895833770.webp' })
            .setDescription(`\n${icerik}\n`)
            .setFooter({ text: `${message.author.tag} yayınladı.`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();
        return message.channel.send({ embeds: [duyuruEmbed] });
    }

    // !uptime
    if (msg === '!uptime') {
        const uptime = process.uptime();
        const saat = Math.floor(uptime / 3600);
        const dakika = Math.floor((uptime % 3600) / 60);
        return message.reply(`🚀 Bot **${saat} saat, ${dakika} dakikadır** çalışıyor.`);
    }

// !ses [Kanal_ID] - Güncellenmiş ve Daha Sağlam Versiyon
    if (msg.startsWith('!ses ')) {
        const channelId = message.content.slice(5).trim();
        const channel = message.guild.channels.cache.get(channelId);

        if (!channel) return message.reply('❌ Kanal bulunamadı! ID doğru mu?');
        if (channel.type !== 2) return message.reply('❌ Girdiğin ID bir ses kanalına ait değil!');

        try {
            joinVoiceChannel({
                channelId: channel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
                selfDeaf: true, // Botun kendini sağırlaştırması (hata payını azaltır)
                selfMute: false
            });
            return message.reply(`✅ **${channel.name}** kanalına başarıyla giriş yaptım!`);
        } catch (error) {
            console.error('Ses Hatası:', error);
            return message.reply('❌ Ses kanalına bağlanırken teknik bir hata oluştu.');
        }
    }
});

// ─────────────────────────────────────────
//  ETKİLEŞİMLER (BUTON & MODAL)
// ─────────────────────────────────────────
client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isButton()) {
        if (interaction.customId === 'panel_id_sorgu') {
            const modal = new ModalBuilder().setCustomId('modal_id_sorgu').setTitle('ID ile Oyuncu Sorgula');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('sorgu_deger').setLabel('Sunucu ID Gir').setPlaceholder('Ornek: 599').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(6)));
            return interaction.showModal(modal);
        }

        if (interaction.customId === 'panel_isim_sorgu') {
            const modal = new ModalBuilder().setCustomId('modal_isim_sorgu').setTitle('Isim ile Oyuncu Sorgula');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('sorgu_deger').setLabel('Oyuncu Adi Gir').setPlaceholder('Ornek: SD Flexer').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(50)));
            return interaction.showModal(modal);
        }

        if (interaction.customId === 'panel_sunucu_durumu') {
            await interaction.deferReply({ ephemeral: true });
            try {
                const res = await axios.get(`${FIVEM_API}${SERVER_CODE}`, { timeout: 10000 });
                const data = res.data?.Data;
                if (!data) return interaction.editReply({ embeds: [errorEmbed('Sunucu verisi alınamadı.')] });

                const { clients, sv_maxclients, resources } = data;
                const { Developer, Leader, Discord, sv_projectName, banner_detail } = data.vars;
                const doluOran = Math.round((clients / sv_maxclients) * 10);
                const bar = '█'.repeat(doluOran) + '░'.repeat(10 - doluOran);
                const durum = clients === 0 ? '🔴 Boş' : clients >= sv_maxclients ? '🔴 Dolu' : '🟢 Açık';

                const statusEmbed = new EmbedBuilder()
                    .setColor(COLOR_GREEN)
                    .setAuthor({ name: 'SHERIFF DEPARTMANI - Sunucu Durumu', iconURL: 'https://cdn.discordapp.com/emojis/1434613401895833770.webp' })
                    .setThumbnail(banner_detail || null)
                    .setDescription(`<:wek:1488195533502939146> WELLGUN\n> Anlık sunucu durumu aşağıda listelenmiştir.\n\n────────────────────────────────────`)
                    .addFields(
                        { name: '<:wek:1488195533502939146> Sunucu Adı', value: `\`${sv_projectName ?? 'WELLGUN #V8'}\``, inline: false },
                        { name: '<:ProfileImage_main:1488195843071672350> Durum', value: durum, inline: true },
                        { name: '<:member_list_icon:1488195069298085929> Oyuncu Sayısı', value: `\`${clients} / ${sv_maxclients}\``, inline: true },
                        { name: '<:Large_Chest_S_JE1:1488196645014212628> Kaynak Sayısı', value: `\`${resources.length}\``, inline: true },
                        { name: '<a:game:1488196627020644462> Oyun Tipi', value: `\`${data.gametype ?? 'Bilinmiyor'}\``, inline: true },
                        { name: '<:asia_map:1488196600462311486> Harita', value: `\`${data.mapname ?? 'Bilinmiyor'}\``, inline: true },
                        { name: 'Yönetim (Leaders)', value: `\`${Leader ?? 'Bilinmiyor'}\``, inline: false },
                        { name: 'Geliştiriciler', value: `\`${Developer ?? 'Bilinmiyor'}\``, inline: false },
                        { name: '🔗 Discord', value: `${Discord ?? 'Yok'}`, inline: true },
                        { name: `<:Large_Chest_S_JE1:1488196645014212628> Doluluk [${bar}]`, value: `%${Math.round((clients / sv_maxclients) * 100)} dolu`, inline: false },
                        { name: '📜 Script Örnekleri', value: `\`\`\`${resources.slice(0, 10).join(', ')}... ve dahası\`\`\``, inline: false },
                        { name: '🕒 Bot Durumu', value: `Son Restart: \`${bootTime.toLocaleString('tr-TR')}\``, inline: false }
                    )
                    .setFooter({ text: 'WELLGUNSD S𝖝RGU BOTU' }).setTimestamp();

                return interaction.editReply({ embeds: [statusEmbed] });
            } catch (e) {
                return interaction.editReply({ embeds: [errorEmbed('Sunucuya bağlanılamadı.')] });
            }
        }
    }

    if (interaction.isModalSubmit()) {
        const isId = interaction.customId === 'modal_id_sorgu';
        const tip = isId ? 'id' : 'isim';
        const deger = interaction.fields.getTextInputValue('sorgu_deger').trim();
        await interaction.deferReply({ ephemeral: true });

        try {
            const res = await axios.get(`${FIVEM_API}${SERVER_CODE}`);
            const players = res.data?.Data?.players || [];
            const results = players.filter(p => tip === 'id' ? String(p.id) === deger : p.name.toLowerCase().includes(deger.toLowerCase()));

            await sendLog(interaction, tip, deger, results.length);
            if (!results.length) return interaction.editReply({ embeds: [errorEmbed(`"${deger}" aktif değil.`)] });

            const pingBar = ms => (ms < 60 ? '🟢' : ms < 120 ? '🟡' : '🔴');
            const lines = results.map((p, i) => `\`${String(i + 1).padStart(2, '0')}\` **${p.name}**\n      ID: \`${p.id}\` ${pingBar(p.ping)} Ping: \`${p.ping} ms\``).join('\n\n');

            const embed = new EmbedBuilder()
                .setColor(COLOR_GOLD).setAuthor({ name: 'SHERIFF DEPARTMANI - Sorgu Sonucu' })
                .setTitle(`${SERVER_LABEL} | ${tip === 'id' ? 'ID' : 'Isim'}: ${deger}`)
                .setDescription(`> **${results.length}** oyuncu bulundu\n\n${'─'.repeat(36)}\n\n${lines}\n\n${'─'.repeat(36)}`)
                .setFooter({ text: 'Sheriff Departmani' }).setTimestamp();

            await interaction.user.send({ embeds: [embed] }).catch(async () => {
                await interaction.editReply({ embeds: [embed, new EmbedBuilder().setColor(COLOR_RED).setDescription('DM kapalı olduğu için buraya atıldı.')] });
            });
            return interaction.editReply({ embeds: [new EmbedBuilder().setColor(COLOR_GOLD).setDescription('Sonuçlar DM kutunuza iletildi.')] });
        } catch {
            return interaction.editReply({ embeds: [errorEmbed('Sorgu sırasında hata oluştu.')] });
        }
    }
});

// ─────────────────────────────────────────
//  YARDIMCI FONKSİYONLAR
// ─────────────────────────────────────────
function errorEmbed(msg) {
    return new EmbedBuilder().setColor(COLOR_RED).setAuthor({ name: 'S𝖝RGU - Hata' }).setDescription(`Hata: ${msg}`).setTimestamp();
}

async function sendLog(interaction, tip, deger, sonuc) {
    if (!LOG_CHANNEL_ID) return;
    const ch = client.channels.cache.get(LOG_CHANNEL_ID);
    if (!ch) return;
    const logEmbed = new EmbedBuilder()
        .setColor(COLOR_LOG).setAuthor({ name: 'Sheriff - Sorgu Log' })
        .addFields(
            { name: 'Kullanan', value: `${interaction.user.tag}`, inline: true },
            { name: 'Tip', value: tip.toUpperCase(), inline: true },
            { name: 'Deger', value: deger, inline: true },
            { name: 'Sonuc', value: `${sonuc} kayit`, inline: true }
        ).setTimestamp();
    await ch.send({ embeds: [logEmbed] }).catch(() => {});
}

client.login(process.env.DISCORD_BOT_TOKEN);
