const { SlashCommandBuilder } = require('discord.js');
const { GoogleGenAI } = require('@google/genai');
const aiAPIKey = process.env.GEMINI_AI_API_KEY;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('grammarcheck')
        .setDescription('Not sure if the grammar is correct? I can help you check!')
        .addStringOption(option =>
            option
                .setName('sentence')
                .setDescription(`Enter the sentence(s) here that you want to get the grammar checked. `)
                .setRequired(true)
                .setMaxLength(1500)
        )
        .addStringOption((option) =>
            option
                .setName('type')
                .setDescription(`Which type of sentence is it? Casual, Professional or what? Default is normal.`)
                .setRequired(false)
                .addChoices(
                    { name: "Normal", value: "Normal" },
                    { name: "Casual", value: "Casual" },
                    { name: "Professional", value: "Professional" },
                    { name: "Informal / Gen Z-esque", value: "Informal" },
                )
        ),

    async execute(interaction) {
        // Send the initial reply and get the user's input
        await interaction.deferReply();
        const sentence = interaction.options.getString('sentence');
        const sentenceType = interaction.options.getString('type') || "Normal";

        try {
            // Creating the AI Model instance and giving it the user's sentence/s as prompt
            const ai = new GoogleGenAI({ apiKey: aiAPIKey });
            const aiResponse = await ai.interactions.create({
                model: "gemini-flash-lite-latest",
                input: `Sentence: ${sentence}. Sentence Type: ${sentenceType}`,
                // Give the AI Model the system instructions (How it should behave)
                system_instruction: "You are a grammar checking AI for the KLAIR Discord Bot. You will be provided with a (or multiple) sentence/s and its desired conversion type. You need to correct the grammar, spelling and tone of the sentence/s in accordance to the desired conversion type. Make sure the tone is appropriate and the grammar is correct. Try not to change the meaning of the sentence. For Normal sentence type, just correct the grammar and spelling. For Casual sentence type, make it more friendly and less formal. For Professional sentence type, make it more formal and professional. For Informal / Gen Z-esque sentence type, make it more informal and Gen Z-esque (like using slang language, however, not overusing it.) Keep your responses under 1500 characters at all costs. No more than 1500 characters can your response grow to.",
            });

            // Updating the reply with the generated output of the AI Model.
            await interaction.editReply(`**Grammar Corrected:** ${aiResponse.output_text}\n\n**-# Powered by ~/KLAIR AI. I can make mistakes! Always double check information before trusting it.**`);
        } catch (error) {
            // Error Handling: If the bot encountered an error while generating a response, edit the reply telling that.
            console.error(error);
            await interaction.editReply('I encountered an error while generating a response. Am I rate limited or do I not have an API Key set?');
        }
    },
};