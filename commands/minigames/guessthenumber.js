const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags, LabelBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('guessthenumber').setDescription('Guess the number in the range 0-100. Aim to guess it in the least number of attempts!'),
    async execute(interaction) {

        // Building the options
        const guessBtn = new ButtonBuilder()
            .setCustomId('guess')
            .setLabel('Guess')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅');

        const giveupBtn = new ButtonBuilder()
            .setCustomId('giveup')
            .setLabel('Give up')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('❌');

        const row = new ActionRowBuilder().addComponents(guessBtn, giveupBtn);

        // Choosing a random number between 0 - 100
        const botChoice = Math.floor(Math.random() * (100 - 0 + 1)) + 0;

        const response = await interaction.reply({ content: 'Guess The Number! I`ve selected a number in the range 0-100 and I\'ll tell you if you\'re close. ', components: [row], withResponse: true });

        // Creating the modal (page) where the user enters their guess
        const userGuessModal = new ModalBuilder()
            .setCustomId('userGuessModal')
            .setTitle('Enter your guess.');

        const userGuessInput = new TextInputBuilder()
            .setCustomId('userGuess')
            .setPlaceholder('1, 44, 82, 92, 100, 34...')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(3)
            .setMinLength(1)
            .setRequired(true);

        const userGuessLabel = new LabelBuilder()
            .setLabel('Enter your guess.')
            .setDescription('The guess must be between 0 and 100 (including 0 and 100).')
            .setTextInputComponent(userGuessInput);

        userGuessModal.addLabelComponents(userGuessLabel);

        // Create a collector to listen for button clicks
        const collectorFilter = (i) => i.user.id === interaction.user.id;

        let gameActive = true;
        let attempts = 0;

        while (gameActive) {
            try {
                const selection = await response.resource.message.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

                if (selection.customId === 'guess') {

                    await selection.showModal(userGuessModal);

                    let modalSubmit;
                    try {
                        // Wait for the user to submit the modal
                        modalSubmit = await selection.awaitModalSubmit({ filter: i => i.user.id === interaction.user.id, time: 60_000 });
                    } catch (error) {
                        // User closed the modal or didn't submit in time
                        continue;
                    }

                    const userGuessStr = modalSubmit.fields.getTextInputValue('userGuess').trim();

                    // Edge Case Handling: If user entered character that isn't a number
                    if (!/^\d+$/.test(userGuessStr)) {
                        await modalSubmit.reply({
                            content: "❌ Guess must be a whole number. Click **Guess** again to try.",
                            flags: MessageFlags.Ephemeral
                        });
                        continue;
                    }

                    const guessValue = parseInt(userGuessStr);

                    // Edge Case Handling: If user entered a number outside the range
                    if (guessValue < 0 || guessValue > 100) {
                        await modalSubmit.reply({
                            content: "❌ Your guess must be between 0 and 100. Click **Guess** again to try.",
                            flags: MessageFlags.Ephemeral
                        });
                        continue;
                    }

                    attempts++; // Increment the numbers of attempts after every valid attempt

                    // Game Logic: Checking the user's guess
                    if (guessValue === botChoice) {
                        await modalSubmit.update({ content: `Woah! You guessed the number correctly! It was **${botChoice}**.\nNumber of attempts you did: **${attempts}**`, components: [] });
                        gameActive = false;
                    } else if (guessValue < botChoice) {
                        await modalSubmit.update({ content: `Your guess (**${guessValue}**) is too low. Click **Guess** again to try.`, components: [row] });
                    } else {
                        await modalSubmit.update({ content: `Your guess (**${guessValue}**) is too high. Click **Guess** again to try.`, components: [row] });
                    }

                } else if (selection.customId === 'giveup') {
                    // End the game if user chooses to give up
                    await selection.update({ content: `Haha! I knew you would give up! The number I had selected was **${botChoice}**.\nNumber of attempts you did: **${attempts}**`, components: [] });
                    gameActive = false;
                }
            } catch (error) {
                // Edit the reply if interaction collector timed out (60 seconds)
                await interaction.editReply({ content: 'You need to click the buttons to pick your choice! Run the command again to play!', components: [] }).catch(() => { });
                gameActive = false;
            }
        }
    },
};