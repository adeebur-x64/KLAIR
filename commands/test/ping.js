const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!'),
    async execute(interaction) {
        // Reply with "Pong!" when the user runs the /ping command
        await interaction.reply('Pong!');
    },
};