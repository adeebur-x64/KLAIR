const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription(`Replies with a random prediction of the question you ask!`)
        .addStringOption(option =>
            option
                .setName('question')
                .setDescription('Enter your question here. It must end with a "?"')
                .setRequired(true)
        ),


    async execute(interaction) {

        const answers = [
            "Yep Definitely!",
            "Not at all!",
            "Nope",
            "Yep",
            "What kind of question is this? Obviously no!",
            "Never!",
            "I'm not sure about this one.",
            "Yeah!",
            "Maybe!",
            "There is a high chance of that happening!",
            "No.",
            "Very unlikely.",
            "I'm doubtful that's gonna happen",
            "Without a doubt!",
            "Absolutely!"
        ]

        const botPrediction = answers[Math.floor(Math.random() * answers.length)];

        await interaction.reply(`Question: ${interaction.options.getString('question')}\nBot's Prediction: **${botPrediction}**`);
    },
};