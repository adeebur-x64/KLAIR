# ~/KLAIR

> A free-to-use Discord bot packed with AI features, mini-games,
> and a few things you probably didn't know you needed.

---

## All the commands!

| 🤖 AI | 🎮 Mini Games | 🛠️ Other |
|:---:|:---:|:---:|
| Ask questions | Coin flip | 8ball |
| ELI5 | Guess the number | Cat |
| Fact checking | Nim | Dog |
| Grammar checking | Rock Paper Scissors | Crypto Price |
| Live AI | Unscramble | Useless Fact |

---

## Features

`~/KLAIR` is designed to be a small, fun, free-to-use bot that aims to add a bunch of entertaining features to your server.

<details>
<summary><strong>🤖 AI Commands</strong> · 5 commands</summary>

<br>

| Command | Description |
|---|---|
| `/ask` | Ask the AI anything |
| `/eli5` | Get a simple explanation of something |
| `/factcheck` | Check whether a claim is accurate |
| `/grammarcheck` | Check and improve your grammar |
| `/liveai` | Chat with the AI in real time |

</details>

<details>
<summary><strong>🎮 Mini Games</strong> · 5 commands</summary>

<br>

| Command | Description |
|---|---|
| `/coinflip` | Flip a coin |
| `/guessthenumber` | Try to guess the number |
| `/nim` | Play Nim |
| `/rockpaperscissors` | Challenge the bot |
| `/unscramble` | Unscramble the word |

</details>

<details>
<summary><strong>🛠️ Other Commands</strong> · 5 commands</summary>

<br>

| Command | Description |
|---|---|
| `/8ball` | Ask the magic 8-ball |
| `/cat` | Get a random cat |
| `/dog` | Get a random dog |
| `/cryptoprice` | Check cryptocurrency prices |
| `/uselessfact` | Receive a completely useless fact |

</details>

---

## 🚀 Getting Started
Even if you don't know **ANYTHING** about Discord Bot setup, this guide will ensure you get through the process with ease. **You'll be able to host the bot on your computer in under 15 minutes**!

> [!IMPORTANT]
> Ensure you have **Node.JS** and **Git** installed. The latest version of **Node.JS** will be ideal. You can look up a tutorial on installing that on YouTube.

1. **Clone the repository:**  
Open a terminal in your desired directory and run the following command:
```bash
git clone https://github.com/adeebur-x64/KLAIR
```

2. **Install dependencies:**
After the 1st command finishes, run the following commands:
```bash
cd KLAIR && npm install
```

3. **Set up your environment variables:**  
Duplicate the `.env.example` file and remove the `.example` extension from the new file. You'll see something like this in the `.env` file:

```
BOT_TOKEN=ENTER_YOUR_DISCORD_BOT_TOKEN
CLIENT_ID=ENTER_YOUR_DISCORD_BOT_CLIENT_ID_AKA_APPLICATION_ID
GEMINI_AI_API_KEY=ENTER_YOUR_GEMINI_API_KEY_HERE_FROM_GOOGLE_AI_STUDIO
```

**Create a New Discord Application** by going to the [Discord Developer Portal](https://discord.com/developers/applications) and copy the `Application ID` to the `CLIENT_ID` variable.  

**Create a New Bot** in the application and reset its token. Then, copy the `Token` to the `BOT_TOKEN` variable.  

**Invite the Discrod Bot** by going to the OAuth2 URL Generator from the sidepanel of the [Discord Developer Portal](https://discord.com/developers/applications). Select `bot` in the first menu and select the following permissions:
```
Manage Server
Manage Channels
View Channels
Send Messages
Manage Messages
Embed Links
Read Message History
Mention @everyone, @here, and All roles
Use Application Commands
Connect
Speak
Use Voice Activity
Priority Speaker
Use External Sounds
```

**Scroll down** and copy the generated URL to your browser. It will prompt you to login to your discord account and add the bot to a server. Choose the server you want to add the bot to and click on `Continue`. Then, click on `Authorize`. **The bot will be added to your selected discord server.**

**Create a New Project** by going to [Google AI Studio](https://aistudio.google.com/) and create an API Key copy the `API Key` to the `GEMINI_AI_API_KEY` variable.

**Your `.env` file should look something like this now:**
```
BOT_TOKEN=qWeRtY.UiOp
CLIENT_ID=1234567890
GEMINI_AI_API_KEY=AB.qweRtyU.iOp
```

> [!NOTE]
> These are all placeholders. Your `.env` file **must** contain your actual **Discord Bot Token**, **Client ID**, and **Gemini API Key**. Keep these values **safe and secret**, **NEVER** share them with anyone, and **NEVER** commit them to GitHub.

4. **Run the bot:**  
In the same terminal you used to set up the bot, run the following command to start the bot:
```bash
node index.js
```

5. **Test the bot:**  
Go to the server you added the bot to and try typing any command, for example: `/cat`.  
If the **bot responds to your command**, it is **working correctly**.  
If the **bot does not respond to your command**, please **check the terminal for any error messages**.

---