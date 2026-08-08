const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('uselessfact').setDescription('Replies with a random useless fact! Is it useful? Probably not!'),
    async execute(interaction) {

        // Send the initial reply
        await interaction.reply('Fetching a random useless fact from the internet!');

        // Function to get the useless fact from the API
        async function getUselessFact() {
            const url = 'https://uselessfacts.jsph.pl/random.json?language=en';

            try {
                // Fetch the fact, parse it to JSON and return the fact
                const response = await fetch(url);
                const data = await response.json();
                return data;

            } catch {
                // Error Handling: If the bot wasn't able to fetch a fact, edit the reply telling the user
                await interaction.editReply(`Oops! I wasn't able to find a useless fact! I'm sorry!`);
            }

        }

        // Get the fact from the function and display it to the user
        const uselessFact = await getUselessFact();
        await interaction.editReply(`**Useless Fact:** ${uselessFact.text}`);
    },
};