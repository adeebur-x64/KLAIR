const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior, EndBehaviorType, StreamType } = require('@discordjs/voice');
const prism = require('prism-media');
const { PassThrough } = require('stream');
const { GoogleGenAI, Modality } = require('@google/genai');
const aiAPIKey = process.env.GEMINI_AI_API_KEY;

const activeSessions = new Map();

module.exports = {
    data: new SlashCommandBuilder().setName('liveai').setDescription(`Don't feel like typing your prompt to AI? Talk with it instead!`),
    async execute(interaction) {
        if (activeSessions.has(interaction.guild.id)) {
            return interaction.reply({ content: 'A LiveAI session is already active in this server! Please wait for it to finish or end it before starting a new one.', flags: MessageFlags.Ephemeral });
        }
        activeSessions.set(interaction.guild.id, true);

        let session = null;
        let fullTranscript = [];
        let isIntentionallyClosing = false;
        let forceEndSession = false;
        const startBtn = new ButtonBuilder()
            .setCustomId('start')
            .setLabel('Start the session!')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎤');

        const cancelBtn = new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('Cancel the session')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('❌');

        const consentRow = new ActionRowBuilder().addComponents(startBtn, cancelBtn);

        await interaction.deferReply();

        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        await delay(200);

        const response = await interaction.editReply({ content: `~/KLAIR will create a private voice channel for you that you can join under 3 minutes. Once created, you can talk with KLAIR and it'll respond back to you! You can join and leave the VC as many times as you'd like **with one condition: the channel will only be available for 3 minutes after you leave.**\n**NOTE: This deletion timer resets everytime you join the channel. So, if you leave, you'll have exactly 3 minutes to join back in!**\n\nThis message will get edited with the transcription of your conversation **AFTER** the session ends!`, components: [consentRow] });

        const collectorFilter = (i) => i.user.id === interaction.user.id;

        try {
            const consent = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

            if (consent.customId === 'start') {
                let createdChannel = null;
                try {
                    const channelName = `AI - ${interaction.user.username}`;
                    await createVC(channelName);
                    const endBtnRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('end_session')
                            .setLabel('End Session')
                            .setStyle(ButtonStyle.Danger)
                            .setEmoji('❌')
                    );
                    await consent.update({
                        content: `✅ LiveAI Session has been created! Join the Voice Channel and start talking with KLAIR!\n\n**IMPORTANT:** You can join and leave the VC as many times as you'd like with one condition: the channel will only be available for 3 minutes after you leave.\n\n**NOTE:** This deletion timer resets everytime you join the channel. So, if you leave, you'll have exactly 3 minutes to join back in!`,
                        components: [endBtnRow],
                    });
                    
                    const replyMessage = await interaction.fetchReply();
                    const endCollector = replyMessage.createMessageComponentCollector({
                        filter: i => i.customId === 'end_session' && i.user.id === interaction.user.id,
                        time: 0
                    });
                    endCollector.on('collect', async i => {
                        forceEndSession = true;
                        endCollector.stop();
                        try { await i.deferUpdate(); } catch (e) {}
                    });

                    const channels = await interaction.guild.channels.fetch();
                    createdChannel = channels.find((ch) => ch.name === channelName && ch.type === ChannelType.GuildVoice);
                } catch (err) {
                    console.error(err);
                    await consent.update({ content: `❌ Couldn't create a Voice Channel for you!`, components: [] })
                    return;
                }

                if (!createdChannel) {
                    await consent.update({ content: `❌ Something went wrong internally. This isn't your fault. Try running the command again later!`, components: [] })
                    activeSessions.delete(interaction.guild.id);
                    return;
                } else {
                    await liveAI(createdChannel);
                }

            } else {
                await consent.update({ content: `❌ LiveAI Session has been cancelled!`, components: [] })
                activeSessions.delete(interaction.guild.id);
            }

        } catch (err) {
            console.error(err);
            await interaction.editReply({ content: 'You need to click the buttons to pick your choice! Run the command again to play!', components: [] });
            activeSessions.delete(interaction.guild.id);
        }

        async function createVC(vcName) {
            await interaction.guild.channels.create({
                name: vcName,
                type: ChannelType.GuildVoice,
                permissionOverwrites: [
                    {
                        // Deny everyone access to the private voice channel  
                        id: interaction.guild.roles.everyone.id,
                        deny: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.Connect,
                            PermissionFlagsBits.Speak
                        ],
                    },
                    {
                        // Allow ONLY the user to access the voice channel
                        id: interaction.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.Connect,
                            PermissionFlagsBits.Speak,
                        ],
                    },
                    {
                        // Allow the bot to access the voice channel
                        id: interaction.client.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.Connect,
                            PermissionFlagsBits.Speak,
                        ],
                    },
                ],
            });
        }

        async function startLiveAI(connection, player, userId) {
            const ai = new GoogleGenAI({ apiKey: aiAPIKey });
            const model = `gemini-3.1-flash-live-preview`;
            const config = { responseModalities: [Modality.AUDIO] };

            // Stream for Gemini's output audio
            let audioOutStream = null;

            async function connectToGemini() {
                try {
                    session = await ai.live.connect({
                        model: model,
                        callbacks: {
                            onopen: function () {
                                console.log(`LiveAI Session Started!`)
                            },
                            onmessage: function (message) {
                                try {
                                    const data = typeof message === 'string' ? JSON.parse(message) : message;

                                    if (data.serverContent && data.serverContent.outputTranscription && data.serverContent.outputTranscription.text) {
                                        fullTranscript.push(data.serverContent.outputTranscription.text);
                                    }

                                    if (data.serverContent && data.serverContent.modelTurn) {
                                        const parts = data.serverContent.modelTurn.parts;
                                        for (const part of parts) {
                                            if (part.inlineData && part.inlineData.data) {
                                                console.log('[LiveAI] Received audio response chunk from Gemini Live!');

                                                // If this is the start of a new response, create a fresh playback stream
                                                if (!audioOutStream) {
                                                    audioOutStream = new PassThrough();
                                                    const ffmpeg = new prism.FFmpeg({
                                                        args: [
                                                            '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', '-',
                                                            '-f', 's16le', '-ar', '48000', '-ac', '2'
                                                        ]
                                                    });
                                                    audioOutStream.pipe(ffmpeg);
                                                    const resource = createAudioResource(ffmpeg, { inputType: StreamType.Raw });
                                                    player.play(resource);
                                                }

                                                const audioBuffer = Buffer.from(part.inlineData.data, 'base64');
                                                audioOutStream.write(audioBuffer);
                                            }
                                        }
                                    }

                                    // When Gemini finishes its turn, close the stream so the player finishes gracefully
                                    if (data.serverContent && data.serverContent.turnComplete) {
                                        if (audioOutStream) {
                                            audioOutStream.end();
                                            audioOutStream = null;
                                        }
                                    }
                                } catch (err) {
                                    console.error('[LiveAI] Error processing message:', err);
                                }
                            },
                            onerror: function (e) {
                                console.error(`Error: ${e.message}`)
                            },
                            onclose: function (e) {
                                console.log(`Closed: ${e.reason}`)
                                if (!isIntentionallyClosing) {
                                    console.log(`[LiveAI] Reconnecting session...`);
                                    setTimeout(() => {
                                        connectToGemini().catch(err => console.error('[LiveAI] Failed to reconnect:', err));
                                    }, 1000);
                                }
                            },
                        },
                        config: {
                            responseModalities: [Modality.AUDIO],
                            systemInstruction: {
                                parts: [{ text: "You are a helpful voice assistant in a Discord call which was created by KLAIR. If someone asks which AI you are, tell them you're an AI assistant created for KLAIR discord bot. ALWAYS respond with audio. Make sure to stay ethical and legal. Do not generate any harmful, explicit, or inappropriate content. If the question is beyond your knowledge or capabilities, admit it honestly." }]
                            }
                        },
                    });
                } catch (err) {
                    console.error('[LiveAI] Connection error:', err);
                }
            }

            // Initial connection
            await connectToGemini();

            // Listen to when the user starts speaking
            let isRecording = false;

            connection.receiver.speaking.on('start', (speakerId) => {
                if (speakerId !== userId) return;
                if (isRecording) return; // Prevent overlapping recordings

                isRecording = true;

                console.log('[LiveAI] User started speaking...');

                const opusStream = connection.receiver.subscribe(userId, {
                    end: {
                        behavior: EndBehaviorType.AfterSilence,
                        duration: 1500, // 1.5 seconds of silence = end of sentence
                    },
                });

                const pcmDecoder = new prism.opus.Decoder({
                    frameSize: 960,
                    channels: 2,
                    rate: 48000
                });

                // Use FFmpeg to properly downsample, apply anti-aliasing, and BOOST VOLUME by 5x
                const downsampler = new prism.FFmpeg({
                    args: [
                        '-f', 's16le', '-ar', '48000', '-ac', '2', '-i', '-',
                        '-af', 'volume=5.0',
                        '-f', 's16le', '-ar', '16000', '-ac', '1'
                    ]
                });

                const pcmStream = opusStream.pipe(pcmDecoder).pipe(downsampler);

                // Prevent unhandled errors from crashing the bot
                opusStream.on('error', (err) => console.warn(`[LiveAI] ⚠️ Ignored opusStream error: ${err.message}`));
                pcmDecoder.on('error', (err) => console.warn(`[LiveAI] ⚠️ Ignored pcmDecoder error: ${err.message}`));
                downsampler.on('error', (err) => console.warn(`[LiveAI] ⚠️ Ignored downsampler error: ${err.message}`));

                let audioChunks = [];

                // Accumulate audio chunks while the user is speaking
                pcmStream.on('data', (chunk) => {
                    audioChunks.push(chunk);
                });

                pcmStream.on('end', () => {
                    isRecording = false; // Release the recording lock

                    const totalBuffer = Buffer.concat(audioChunks);

                    // Ignore audio snippets shorter than 0.5 seconds (16,000 bytes)
                    if (totalBuffer.length < 16000) {
                        console.log(`[LiveAI] Ignored short audio snippet (${totalBuffer.length} bytes, < 0.5s)`);
                        return;
                    }

                    // 🎚️ Algorithmic Noise Gate: Calculate RMS (Root Mean Square) volume
                    let sum = 0;
                    const sampleCount = totalBuffer.length / 2;
                    for (let i = 0; i < totalBuffer.length; i += 2) {
                        const sample = totalBuffer.readInt16LE(i);
                        sum += sample * sample;
                    }
                    const rms = Math.sqrt(sum / sampleCount);

                    // If the audio is too quiet (static, fans, breathing), just drop it completely
                    if (rms < 300) {
                        console.log(`[LiveAI] 🔇 Ignored background noise (RMS: ${Math.round(rms)} < 300)`);
                        return;
                    }

                    console.log(`[LiveAI] 🗣️ User stopped speaking. RMS: ${Math.round(rms)}. Sending ${totalBuffer.length} bytes of audio to Gemini Live!`);

                    // We completely bypass sendRealtimeInput (which uses aggressive VAD) and explicitly upload 
                    // the audio buffer as a complete Turn using sendClientContent. This guarantees transcription.
                    if (session) {
                        session.sendClientContent({
                            turns: [{
                                role: "user",
                                parts: [{
                                    inlineData: {
                                        mimeType: 'audio/pcm;rate=16000',
                                        data: totalBuffer.toString('base64')
                                    }
                                }]
                            }],
                            turnComplete: true
                        });
                    } else if (session) {
                        session.sendClientContent({ turnComplete: true });
                    }
                });
            });
        };

        async function liveAI(vChannel) {

            const player = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Pause,
                },
            });

            const connection = joinVoiceChannel({
                channelId: vChannel.id,
                guildId: vChannel.guild.id,
                adapterCreator: vChannel.guild.voiceAdapterCreator,
                selfDeaf: false,
            });

            const subscription = connection.subscribe(player);

            player.unpause();

            let hasStartedLiveAI = false;

            // Check if they are already in the VC somehow
            const currentVoiceState = interaction.guild.voiceStates.cache.get(interaction.user.id);
            if (currentVoiceState?.channelId === vChannel.id) {
                hasStartedLiveAI = true;
                startLiveAI(connection, player, interaction.user.id);
            }

            let userDisconnectTimer = 0;

            while (180 > userDisconnectTimer && !forceEndSession) {

                const currentVoiceState = interaction.guild.voiceStates.cache.get(interaction.user.id);

                if (currentVoiceState?.channelId !== vChannel.id) {
                    player.pause();
                    userDisconnectTimer += 1;
                } else {
                    if (!hasStartedLiveAI) {
                        hasStartedLiveAI = true;
                        startLiveAI(connection, player, interaction.user.id);
                    }
                    if (userDisconnectTimer > 0) {
                        player.unpause();
                        userDisconnectTimer = 0;
                    }
                }

                await delay(1000);
            }

            if (userDisconnectTimer >= 180 || forceEndSession) {
                isIntentionallyClosing = true;
                if (session) await session.close();
                connection.destroy();
                subscription.unsubscribe();
                player.stop();
                await vChannel.delete();

                let timeoutMessage = forceEndSession 
                    ? `**Session Ended!** You have manually ended the LiveAI session. I have deleted the channel for now.`
                    : `**Time's up!** It's been 3 minutes since you've left the voice channel. I have deleted the channel for now.`;

                await interaction.followUp({
                    content: timeoutMessage,
                    components: [],
                    flags: MessageFlags.Ephemeral,
                })

                // 📝 Show loading state
                await interaction.editReply({
                    content: `**✨ Thank you for using ~KLAIR Bot's LiveAI Feature!**\n\n*Generating session summary... ⏳*`,
                    components: [],
                })

                // 📝 Generate the transcript summary and attach to original reply
                let finalSummaryText = '*No conversation data was recorded.*';
                if (fullTranscript.length > 0) {
                    try {
                        const transcriptText = fullTranscript.join(' ');
                        const textAi = new GoogleGenAI({ apiKey: aiAPIKey });
                        const response = await textAi.models.generateContent({
                            model: 'gemma-4-31b-it',
                            contents: `You are summarizing a voice session between a User and an AI Assistant. I will provide you with the AI's exact text responses. Using these responses, please infer what the conversation was about and write a cohesive, comprehensive summary of the entire interaction (both what the user likely asked and what the AI answered). Keep the summary engaging and under 1500 characters.\n\nAI's Responses:\n${transcriptText}`
                        });

                        finalSummaryText = response.text;
                    } catch (err) {
                        console.error('[LiveAI] ❌ Failed to generate summary:', err);
                        finalSummaryText = '*Failed to generate summary.*';
                    }
                }

                await interaction.editReply({
                    content: `**Summary:**\n${finalSummaryText}\n\n**✨ Thank you for using ~KLAIR Bot's LiveAI Feature!**`,
                    components: [],
                })

                activeSessions.delete(interaction.guild.id);
            }

        }


    },
};