const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('rockpaperscissor').setDescription('Play Rock Paper Scissors with the bot!'),
    async execute(interaction) {

        // Create the buttons
        const rock = new ButtonBuilder()
            .setCustomId('rock')
            .setLabel('Rock')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🪨');

        const paper = new ButtonBuilder()
            .setCustomId('paper')
            .setLabel('Paper')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📄');

        const scissors = new ButtonBuilder()
            .setCustomId('scissors')
            .setLabel('Scissors')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('✂️');

        const row = new ActionRowBuilder().addComponents(rock, paper, scissors);

        // Send the initial reply
        const response = await interaction.reply({ content: 'Rock Paper Scissors Shoot! I\'ve picked my move. Pick yours below, ', components: [row], withResponse: true });

        // Bot choosing its own move
        const options = ["rock", "paper", "scissors"];
        const botChoice = options[Math.floor(Math.random() * options.length)];

        // Create a collector to listen for button clicks
        const collectorFilter = (i) => i.user.id === interaction.user.id;

        try {
            const selection = await response.resource.message.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

            // Logic: If user clicks rock.
            if (selection.customId === 'rock') {

                if (botChoice === 'paper') {
                    await selection.update({ content: `You picked :rock: rock! I picked :page_facing_up: ${botChoice}\n**I Won!**`, components: [] });
                } else if (botChoice === 'scissors') {
                    await selection.update({ content: `You picked :rock: rock! I picked :scissors: ${botChoice}\n**You Won! Well, I wanted to win! :(**`, components: [] });
                } else {
                    await selection.update({ content: `You picked :rock: rock! I picked :rock: ${botChoice}\n**It's a Tie!**`, components: [] });
                }

            }

            // Logic: If user clicks paper
            else if (selection.customId === 'paper') {

                if (botChoice === 'rock') {
                    await selection.update({ content: `You picked :page_facing_up: paper! I picked :rock: ${botChoice}\n**You Won! Well, I wanted to win! :(**`, components: [] });
                } else if (botChoice === 'scissors') {
                    await selection.update({ content: `You picked :page_facing_up: paper! I picked :scissors: ${botChoice}\n**I Won!**`, components: [] });
                } else {
                    await selection.update({ content: `You picked :page_facing_up: paper! I picked :page_facing_up: ${botChoice}\n**It's a Tie!**`, components: [] });
                }

            }

            // Logic: If user clicks scissors
            else if (selection.customId === 'scissors') {

                if (botChoice === 'rock') {
                    await selection.update({ content: `You picked :scissors: scissors! I picked :rock: ${botChoice}\n**I Won!**`, components: [] });
                } else if (botChoice === 'paper') {
                    await selection.update({ content: `You picked :scissors: scissors! I picked :page_facing_up: ${botChoice}\n**You Won! Well, I wanted to win! :(**`, components: [] });
                } else {
                    await selection.update({ content: `You picked :scissors: scissors! I picked :scissors: ${botChoice}\n**It's a Tie!**`, components: [] });
                }

            }

        } catch {
            // Edit the reply if interaction collector timed out (60 seconds)
            await interaction.editReply({ content: 'You need to click the buttons to pick your choice! Run the command again to play!', components: [] });
        }
    },
};