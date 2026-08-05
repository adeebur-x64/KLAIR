const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('uselessfact').setDescription('Replies with a random useless fact! Is it useful? Probably not!'),
    async execute(interaction) {
        await interaction.reply('Fetching a random useless fact from the internet!');

        async function getUselessFact() {
            const url = 'https://uselessfacts.jsph.pl/random.json?language=en';

            try {

                const response = await fetch(url);
                const data = await response.json();
                return data;

            } catch {
                await interaction.editReply(`Oops! I wasn't able to find a useless fact! I'm sorry!`);
            }

        }

        const uselessFact = await getUselessFact();
        await interaction.editReply(`**Useless Fact:** ${uselessFact.text}`);
    },
};