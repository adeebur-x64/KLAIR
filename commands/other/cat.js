const { SlashCommandBuilder, MediaGalleryBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('cat').setDescription('Searches the internet to display a cat image!'),
    async execute(interaction) {

        // Function to fetch a random cat image from an API
        async function fetchCatImage() {
            try {
                const response = await fetch('https://api.thecatapi.com/v1/images/search');
                const data = await response.json();

                const catImageURL = data[0].url;
                return catImageURL;
            } catch {
                // Error Handling: If bot wasn't able to fetch a cat image from the API
                await interaction.editReply(`NOOOO! I wasn't able to search for a cat image! I'm sorry!`)
            }
        }

        // Send the initial response 
        await interaction.reply('Searching the internet for some cute cat images!');

        // Create a media gallery and add the cat image as an item to it
        const imageURL = await fetchCatImage();

        const catImage = new MediaGalleryBuilder().addItems(
            (MediaGalleryItem) =>
                MediaGalleryItem
                    .setDescription('An image of a cute cat!')
                    .setURL(imageURL)
        );

        // Edit the reply if the bot was able to find the image
        await interaction.editReply({ content: `Ayy! I was able to find a cute cat image! Here you go!`, components: [] });

        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        await delay(1000);

        // Delete the initial reply
        await interaction.deleteReply();

        // Send another reply with the media gallery that was created earlier
        await interaction.followUp({
            components: [catImage],
            flags: MessageFlags.IsComponentsV2
        });
    },
};