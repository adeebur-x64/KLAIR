const { SlashCommandBuilder } = require('discord.js');
const { GoogleGenAI } = require('@google/genai');
const aiAPIKey = process.env.GEMINI_AI_API_KEY;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('factcheck')
        .setDescription(`Spotted a claim seeming fishy? I can help check if its correct! (NOTE: I DON'T HAVE WEB ACCESS)`)
        .addStringOption(option =>
            option
                .setName('claim')
                .setDescription('Enter the claim here that you want to get checked.')
                .setRequired(true)
                .setMaxLength(1500)
        ),

    async execute(interaction) {
        // Send the initial reply and get the user's input
        await interaction.deferReply();
        const claim = interaction.options.getString('claim');

        try {
            // Creating the AI Model instance and giving it the user's claim as prompt
            const ai = new GoogleGenAI({ apiKey: aiAPIKey });
            const aiResponse = await ai.interactions.create({
                model: "gemini-flash-lite-latest",
                input: claim,
                // Give the AI Model the system instructions (How it should behave)
                system_instruction: "You are an AI assistant created by KLAIR. Your job is to take a claim that the user has provided and fact check it. Make sure to stay ethical and legal. Do not generate any harmful, explicit, or inappropriate content. If the claim is beyond your knowledge or capabilities, admit it honestly. Remember, you don't have internet acess so you can't fact check all the claims correctly. If the response is correct, say '✅ Fact is correct!'. If it's wrong, say '❌ Fact is wrong!'. If you're not sure, say '≈ I'm not sure!'. Send this in the first line of your response. Then from the next line, add a small explanation in a casual tone about why you think it's correct, wrong or you're not sure about it. Keep your responses under 1500 characters at all costs. No more than 1500 characters can your response grow to.",
            });

            // Updating the reply with the generated output of the AI Model.
            await interaction.editReply(`**Fact Checked:** ${aiResponse.output_text}\n\n**-# Powered by ~/KLAIR AI. I can make mistakes! Always double check information before trusting it.**`);
        } catch (error) {
            // Error Handling: If the bot encountered an error while generating a response, edit the reply telling that.
            console.error(error);
            await interaction.editReply('I encountered an error while generating a response. Am I rate limited or do I not have an API Key set?');
        }
    },
};