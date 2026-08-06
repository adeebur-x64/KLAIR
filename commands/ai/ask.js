const { SlashCommandBuilder } = require('discord.js');
const { GoogleGenAI } = require('@google/genai');
const aiAPIKey = process.env.GEMINI_AI_API_KEY;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Ask an AI a question and get its answer!')
        .addStringOption(option =>
            option
                .setName('question')
                .setDescription('Enter the question here that you want to ask the AI.')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();
        const question = interaction.options.getString('question');
        try {
            // Creating the AI Model instance and giving it the user's question as prompt
            const ai = new GoogleGenAI({ apiKey: aiAPIKey });
            const aiResponse = await ai.interactions.create({
                model: "gemini-flash-lite-latest",
                input: question,
                system_instruction: "You are an AI assistant created by KLAIR. If someone asks which AI you are, tell them you're an AI assistant created for KLAIR discord bot. You take the inputs of the Discord Users and answer them. Make sure to stay ethical and legal. Do not generate any harmful, explicit, or inappropriate content. Avoid controversial topics. Always be respectful and unbiased. If the question is beyond your knowledge or capabilities, admit it honestly. Reply with the users in a friendly tone and don't get angry on them. Remember, you're a discord bot. Keep your responses under 1500 characters at all costs. No more than 1500 characters can your response grow to.",
            });

            // Updating the reply with the generated output of the AI Model.
            await interaction.editReply(`Answer:** ${aiResponse.output_text}\n\n**-# Powered by ~/KLAIR AI. I can make mistakes! Always double check information before trusting it.**`);
        } catch (error) {
            console.error(error);

            // Updating the reply to let the user know that an error has occurred.
            await interaction.editReply('I encountered an error while generating a response. Am I rate limited or do I not have an API Key set?');
        }
    },
};