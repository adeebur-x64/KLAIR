const { SlashCommandBuilder, MediaGalleryBuilder, MediaGalleryItem, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('cat').setDescription('Searches the internet to display a cat image!'),
    async execute(interaction) {

        async function fetchCatImage() {
            try {
                const response = await fetch('https://api.thecatapi.com/v1/images/search');
                const data = await response.json();

                const catImageURL = data[0].url;
                return catImageURL;
            } catch {
                await interaction.editReply(`NOOOO! I wasn't able to search for a cat image! I'm sorry!`)
            }
        }

        await interaction.reply('Searching the internet for some cute cat images!');

        const imageURL = await fetchCatImage();

        const catImage = new MediaGalleryBuilder().addItems(
            (MediaGalleryItem) =>
                MediaGalleryItem
                    .setDescription('An image of a cute cat!')
                    .setURL(imageURL)
        );

        await interaction.editReply({ content: `Ayy! I was able to find a cute cat image! Here you go!`, components: [] });

        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        await delay(1000);

        await interaction.deleteReply();

        await interaction.followUp({
            components: [catImage],
            flags: MessageFlags.IsComponentsV2
        });
    },
};