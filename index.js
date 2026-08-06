// Necessary libraries 
const { Client, Collection, GatewayIntentBits, ActivityType, PresenceUpdateStatus } = require('discord.js');
require('dotenv').config();
const token = process.env.BOT_TOKEN;
const fs = require('node:fs');
const path = require('node:path');
const { GoogleGenAI } = require('@google/genai');
const aiAPIKey = process.env.GEMINI_AI_API_KEY;

// Creating a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
})

const PREFIX = "KLAIR, ";

client.on('messageCreate', async message => {
    // Ignore messages from bots and ignore messages that do not start with the prefix.
    if (message.author.bot || !message.content.toUpperCase().startsWith(PREFIX.toUpperCase())) return;

    // Extract the actual question asked after the prefix.
    const userInput = message.content.slice(PREFIX.length)
    if (!userInput.trim()) return;

    await message.channel.sendTyping();

    // Use an AI Model to generate the answer to the question
    async function getKLAIRResponse(userInput) {
        const ai = new GoogleGenAI({ apiKey: aiAPIKey });
        const aiResponse = await ai.interactions.create({
            model: "gemini-flash-lite-latest",
            input: userInput,
            system_instruction: "You are an AI assistant created by KLAIR. If someone asks which AI you are, tell them you're an AI assistant created for KLAIR discord bot. You take the inputs of the Discord Users and answer them. Make sure to stay ethical and legal. Do not generate any harmful, explicit, or inappropriate content. Avoid controversial topics. Always be respectful and unbiased. If the question is beyond your knowledge or capabilities, admit it honestly. Reply with the users in a friendly tone and don't get angry on them. Remember, you're a discord bot. Keep your responses under 1500 characters at all costs. No more than 1500 characters can your response grow to.",
        });
        await message.channel.send(`**Question:** ${userInput}\n**Answer:** ${aiResponse.output_text}\n\n**-# Powered by ~/KLAIR AI. I can make mistakes! Always double check information before trusting it.**`);
    }

    try {
        getKLAIRResponse(userInput);
    } catch (error) {
        console.error(error);
        await message.channel.send('I encountered an error while generating a response. Am I rate limited or do I not have an API Key set?');
    }
});

client.once('clientReady', () => {
    client.user.setPresence({
        activities: [{
            name: "Fun Mini Games!",
            type: ActivityType.Playing
        }],
        status: PresenceUpdateStatus.Idle,
    })
})

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
};

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
};

// Tell the bot to log in to discord
client.login(token);