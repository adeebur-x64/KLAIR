const { SlashCommandBuilder, MediaGalleryBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('dog').setDescription('Searches the internet to display a dog image!'),
    async execute(interaction) {

        async function fetchCatImage() {
            try {
                const response = await fetch('https://api.thedogapi.com/v1/images/search');
                const data = await response.json();

                const catImageURL = data[0].url;
                return catImageURL;
            } catch {
                await interaction.editReply(`NOOOO! I wasn't able to search for a dog image! I'm sorry!`)
            }
        }

        await interaction.reply('Searching the internet for some cute dog images!');

        const imageURL = await fetchCatImage();

        const catImage = new MediaGalleryBuilder().addItems(
            (MediaGalleryItem) =>
                MediaGalleryItem
                    .setDescription('An image of a cute dog!')
                    .setURL(imageURL)
        );

        await interaction.editReply({ content: `Ayy! I was able to find a cute dog image! Here you go!`, components: [] });

        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        await delay(1000);

        await interaction.deleteReply();

        await interaction.followUp({
            components: [catImage],
            flags: MessageFlags.IsComponentsV2
        });
    },
};