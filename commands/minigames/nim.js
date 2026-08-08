const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('nim').setDescription('Play a game of Nim against the Bot!'),
    async execute(interaction) {

        // Create the buttons
        const playBtn = new ButtonBuilder()
            .setCustomId('play')
            .setLabel('Play the game!')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🎮');

        const cancelBtn = new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌');

        const consentRow = new ActionRowBuilder().addComponents(playBtn, cancelBtn);

        // Send initial response with the buttons
        const response = await interaction.reply({ content: `Nim is a strategic mini game so you'll have to use your brain for this one.\n**Explanation of the game:** There are 15 rocks in total. In each turn, the player can take away 1, 2 or 3 rocks. The bot will also randomly take away some number of rocks. In order to win you need to make the opponent take the last rock. If you take the last rock, you lose! Have fun!`, components: [consentRow] });

        // Create a collector to listen for button clicks
        const collectorFilter = (i) => i.user.id === interaction.user.id;

        // Handle the button click and edit the reply
        try {
            const consent = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

            if (consent.customId === 'play') {
                await game(consent);
            } else {
                await consent.update({ content: `❌ Game cancelled!`, components: [] })
            }

        } catch {
            // Edit the reply if interaction collector timed out (60 seconds)
            await interaction.editReply({ content: 'You need to click the buttons to pick your choice! Run the command again to play!', components: [] });
        }

        async function game(consentInteraction) {

            // Create the game buttons
            const take1 = new ButtonBuilder()
                .setCustomId('1')
                .setLabel('Take 1')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('1️⃣');

            const take2 = new ButtonBuilder()
                .setCustomId('2')
                .setLabel('Take 2')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('2️⃣');

            const take3 = new ButtonBuilder()
                .setCustomId('3')
                .setLabel('Take 3')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('3️⃣');

            // Initialising game variables
            let rocks = 15;
            const getRockVis = (count) => '🪨'.repeat(count);
            let gameActive = true;
            const playRow = new ActionRowBuilder().addComponents(take1, take2, take3);

            // Updating the reply after the `play game` consent is received
            await consentInteraction.update({ content: `Let's begin! Currently there are **${rocks}** rocks!\n**Visualisation:** ${getRockVis(rocks)}`, components: [playRow] });

            const collectorFilter = (i) => i.user.id === interaction.user.id;

            while (gameActive) {
                try {
                    const selection = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

                    // Processing player's turn
                    const playerMove = parseInt(selection.customId);
                    rocks -= playerMove;

                    // Logic: If user takes away last rock, user loses.
                    if (rocks <= 0) {
                        gameActive = false;
                        await selection.update({ content: `**You took away the last rock! You lose!**`, components: [] });
                        break;
                    } else {
                        // Update the reply with the number of rocks left
                        await selection.update({ content: `You took away **${playerMove}** rocks. Currently there are **${rocks}** rocks!\n**Visualisation:** ${getRockVis(rocks)}`, components: [] });
                    }

                    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
                    await delay(1500);

                    // Process bot's turn
                    const maxBotMove = Math.min(3, rocks); // Don't take more rocks than available
                    const botMove = Math.floor(Math.random() * maxBotMove) + 1;
                    rocks -= botMove;

                    if (rocks <= 0) {
                        gameActive = false;
                        // Logic: If bot takes away last rock, bot loses.
                        await interaction.editReply({ content: `**Oh man! I took away the last rock! You won!**`, components: [] });
                        break;
                    } else {
                        // Update the reply with the number of rocks left
                        await interaction.editReply({ content: `It's my turn now! I took away **${botMove}** rocks. Currently there are **${rocks}** rocks!\n**Visualisation:** ${getRockVis(rocks)}`, components: [playRow] });
                    }

                } catch (error) {
                    // Edit the reply if interaction collector timed out (60 seconds)
                    await interaction.editReply({ content: 'You took too long to pick your choice! Run the command again to play!', components: [] }).catch(() => { });
                    gameActive = false;
                }
            }
        }
    },
};