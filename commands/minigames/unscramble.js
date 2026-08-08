const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags, LabelBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('unscramble').setDescription('Bot chooses a word and scrambles it. Your job is to unscramble it!'),
    async execute(interaction) {

        // Send the initial reply
        await interaction.reply(`I'm searching for a word and scrambling it!`);

        // Function to fetch a random word from an API
        async function fetchARandomWord() {
            try {
                const wordLength = Math.floor(Math.random() * (8 - 3 + 1)) + 3;

                const dictionaryAPIURL = `https://random-word-api.herokuapp.com/word?length=${wordLength}`;

                const response = await fetch(dictionaryAPIURL);

                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }

                const data = await response.json();

                const word = data[0];
                return word;
            }
            catch {
                // Error Handling: If bot wasn't able to fetch a word
                await interaction.editReply(`Oops! I wasn't able to search for a word!`)
            }
        }

        // Fetch a random word and scramble it
        const randomWord = await fetchARandomWord();
        const scrambledWord = randomWord
            .split('')
            .sort(() => Math.random() - 0.5)
            .join('');

        // Creating the buttons
        const unscrambleBtn = new ButtonBuilder()
            .setCustomId('unscramble')
            .setLabel('Unscramble')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅');

        const giveupBtn = new ButtonBuilder()
            .setCustomId('giveup')
            .setLabel('Give up')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('❌');

        const row = new ActionRowBuilder().addComponents(unscrambleBtn, giveupBtn);

        let response;
        if (randomWord) {
            // Update the reply with the scrambled word and buttons
            response = await interaction.editReply({ content: `I have chosen the word and scrambled it! Here it is: **${scrambledWord}**`, components: [row] });
        } else {
            return;
        }

        // Creating the modal (page) where the user enters their guess
        const userGuessModal = new ModalBuilder()
            .setCustomId('userGuessModal')
            .setTitle('Enter your guess for the unscrambled word.');

        const userGuessInput = new TextInputBuilder()
            .setCustomId('userGuess')
            .setPlaceholder('Bed, Derp, Nerd, Water, Window...')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const userGuessLabel = new LabelBuilder()
            .setLabel('Enter your guess.')
            .setDescription(`Enter the correct unscrambled word or YOU'RE EXECUTED! ok well that was a joke but try guessing it!`)
            .setTextInputComponent(userGuessInput);

        userGuessModal.addLabelComponents(userGuessLabel);

        // Create a collector to listen for button clicks
        const collectorFilter = (i) => i.user.id === interaction.user.id;

        let attempts = 0;
        const collector = response.createMessageComponentCollector({ filter: collectorFilter, time: 60_000 });

        // Event handler for button clicks
        collector.on('collect', async selection => {
            if (selection.customId === 'unscramble') {
                const uniqueModalId = `userGuessModal_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                userGuessModal.setCustomId(uniqueModalId);

                try {
                    await selection.showModal(userGuessModal);
                } catch (e) {
                    console.error("Error showing modal:", e);
                    return;
                }

                let modalSubmit;
                try {
                    modalSubmit = await selection.awaitModalSubmit({
                        filter: i => i.customId === uniqueModalId && i.user.id === interaction.user.id,
                        time: 60_000
                    });
                } catch (error) {
                    return; // User closed the modal or didn't submit in time
                }

                // Get the user's guess
                const userGuessStr = modalSubmit.fields.getTextInputValue('userGuess').trim();

                // Edge Case Handling: If user enters a character that is not a letter
                if (!/^[a-zA-Z]+$/.test(userGuessStr)) {
                    await modalSubmit.reply({
                        content: "❌ Guess must be a word. Click **Unscramble** again to try.",
                        flags: MessageFlags.Ephemeral
                    }).catch(console.error);
                    return;
                }

                attempts++; // Increment the numbers of attempts after every valid attempt

                // Game Logic: Checking the user's guess
                try {
                    if (userGuessStr.toLowerCase() === randomWord.toLowerCase()) {
                        await modalSubmit.update({ content: `Woah! You guessed the word correctly! It was **${randomWord}**.\nNumber of attempts you did: **${attempts}**`, components: [] });
                        collector.stop('won');
                    } else {
                        await modalSubmit.update({ content: `Your guess (**${userGuessStr}**) is incorrect! Try again.`, components: [row] });
                        collector.resetTimer(); // Give them another 60 seconds
                    }
                } catch (err) {
                    // Error Handling: If there was a problem with updating the modal submit
                    console.error("Error updating modal submit:", err);
                }
            } else if (selection.customId === 'giveup') {
                // End the game if the user chooses to give up
                await selection.update({ content: `Haha! I knew you would give up! The word I had selected was **${randomWord}**.\nNumber of attempts you did: **${attempts}**`, components: [] }).catch(console.error);
                collector.stop('giveup');
            }
        });

        // Event handler for when the collector ends
        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                // Error Handling: If the user took too long to click the buttons
                await interaction.editReply({ content: 'You took too long to click the buttons! Run the command again to play!', components: [] }).catch(() => { });
            }
        });
    }
}; 