const { SlashCommandBuilder, MediaGalleryBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('dog').setDescription('Searches the internet to display a dog image!'),
    async execute(interaction) {

        // Function to fetch a random dog image from an API
        async function fetchDogImage() {
            try {
                const response = await fetch('https://api.thedogapi.com/v1/images/search');
                const data = await response.json();

                const dogImageURL = data[0].url;
                return dogImageURL;
            } catch {
                // Error Handling: If bot wasn't able to fetch a dog image from the API
                await interaction.editReply(`NOOOO! I wasn't able to search for a dog image! I'm sorry!`)
            }
        }

        // Send the initial response 
        await interaction.reply('Searching the internet for some cute dog images!');

        // Create a media gallery and add the cat image as an item to it
        const imageURL = await fetchDogImage();

        const dogImage = new MediaGalleryBuilder().addItems(
            (MediaGalleryItem) =>
                MediaGalleryItem
                    .setDescription('An image of a cute dog!')
                    .setURL(imageURL)
        );

        // Edit the reply if the bot was able to find the image
        await interaction.editReply({ content: `Ayy! I was able to find a cute dog image! Here you go!`, components: [] });

        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        await delay(1000);

        // Delete the initial reply
        await interaction.deleteReply();

        // Send another reply with the media gallery that was created earlier
        await interaction.followUp({
            components: [dogImage],
            flags: MessageFlags.IsComponentsV2
        });
    },
};