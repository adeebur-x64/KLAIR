const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cryptoprice')
        .setDescription(`Replies with the current price of the specified crypto currrency!`)
        .addStringOption(option =>
            option
                .setName('cryptocurrency')
                .setDescription('Name of crypto whose price you want to know. Ex. Bitcoin, Ethereum, Dogecoin')
                .setRequired(true)
        ),


    async execute(interaction) {

        const cryptoCurrency = interaction.options.getString('cryptocurrency');
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoCurrency.toLowerCase()}&vs_currencies=usd`;

        await interaction.reply(`Fetching the current price of **${cryptoCurrency}**...`);

        try {

            const response = await fetch(url);
            const data = await response.json();

            if (data[cryptoCurrency.toLowerCase()]) {
                const price = data[cryptoCurrency.toLowerCase()].usd;
                await interaction.editReply(`The current price of **${cryptoCurrency}** is **$${price}**`);
            } else {
                await interaction.editReply(`I couldn't find the price for **${cryptoCurrency}**. Maybe it's not a cryptocurrency?`);
            }

        } catch (error) {
            console.error(error);
            await interaction.editReply('I encountered an error while fetching the price.');
        }

    },
};