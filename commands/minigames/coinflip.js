const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('coinflip').setDescription('Guess whether flipping the coin will land on heads or tails!'),
    async execute(interaction) {

        const heads = new ButtonBuilder()
            .setCustomId('heads')
            .setLabel('Heads')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🪙');

        const tails = new ButtonBuilder()
            .setCustomId('tails')
            .setLabel('Tails')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🦅');

        const row = new ActionRowBuilder().addComponents(heads, tails);

        await interaction.reply('Flipping the coin in the air!');

        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        await delay(1000);

        const response = await interaction.editReply({
            content: `The coin has landed! Guess whether it landed on heads or tails!`,
            components: [row],
            withResponse: true,
        });

        // const choices = ["heads", "tails"];
        // const botGuess = choices[Math.floor(Math.random() * choices.length)];
        const botGuess = Math.random() < 0.5 ? "heads" : "tails";

        const collectorFilter = (i) => i.user.id === interaction.user.id;

        try {
            const guess = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

            if (guess.customId === botGuess) {
                await guess.update({ content: `You guessed it right! The coin landed on **${botGuess}**!`, components: [] })
            } else {
                await guess.update({ content: `Nuh Uh! The coin landed on **${botGuess}** while your guess was **${guess.customId}**.`, components: [] })
            }

        } catch {
            await interaction.editReply({ content: 'You need to click the buttons to pick your choice! Run the command again to play!', components: [] });
        }

    },
};