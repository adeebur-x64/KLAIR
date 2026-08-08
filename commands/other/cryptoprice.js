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

        // Get the user's input of the crypto name and set the API URL
        const cryptoCurrency = interaction.options.getString('cryptocurrency');
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoCurrency.toLowerCase()}&vs_currencies=usd`;

        // Send the intiial reply
        await interaction.reply(`Fetching the current price of **${cryptoCurrency}**...`);

        try {

            // Fetch the API response
            const response = await fetch(url);
            // Parse the response to JSON
            const data = await response.json();

            if (data[cryptoCurrency.toLowerCase()]) {
                // Logic: If the bot was able to fetch the price, edit the reply and display the price
                const price = data[cryptoCurrency.toLowerCase()].usd;
                await interaction.editReply(`The current price of **${cryptoCurrency}** is **$${price}**.`);
            } else {
                // Error Handling: If the bot was NOT able to fetch the price, edit the reply telling it failed
                await interaction.editReply(`I couldn't find the price for **${cryptoCurrency}**. Maybe it's not a cryptocurrency?`);
            }

        } catch (error) {
            // Error Handling: If the bot encountered an error while fetching the price, edit the reply
            console.error(error);
            await interaction.editReply('I encountered an error while fetching the price.');
        }

    },
};