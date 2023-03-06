// Required Declarations
const {
  Client,
  Collection,
  RichEmbed,
  Intents,
  ActivityType,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
} = require("discord.js");

const Discord = require("discord.js");
const fs = require("fs");
const cron = require("cron");
eval(fs.readFileSync("./public/imports.js") + "");

const nodefs = require("node:fs");
const path = require("node:path");

var FileSync = require("lowdb/adapters/FileSync");
var adapter = new FileSync(".data/db.json");
var low = require("lowdb");
var db = low(adapter);
var botAccess;

DbDefaultSetup(db);

function GetDb() {
  return db;
}

function CreateBot() {
  const intents = [
    //'NON_PRIVILEGED', // include all non-privileged intents, would be better to specify which ones you actually need
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // lets you request guild members (i.e. fixes the issue)
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildEmojisAndStickers,
  ];

  let sendDailyEmbed = new cron.CronJob(
    "40 18 17 * * 1-5", () => 
    CreateAndSendDailyBattleMessages(bot, db)
  ); // fires Mon - Thurs, at 18:00:10 (1:00 PM EST)
  //let sendFridayEmbed = new cron.CronJob('15 * 18 * * 5', test); // fires from Monday to Friday, every hour from 8 am to 16
  let checkTournamentBattleReactions = new cron.CronJob(
    "00 15 * * * *", () =>
    SendMessageForDuplicateVotes(bot, db)
  );
  let checkTournamentBattleReactions2 = new cron.CronJob(
    "00 45 * * * *",
    SendMessageForDuplicateVotes(bot, db)
  );

  const bot = new Discord.Client({
    intents: intents,
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  });
  bot.setMaxListeners(0);

  //Log the Bot in
  const botKey = process.env.BOT_KEY;
  bot.login(`${botKey}`).catch(console.error);
  bot.on("ready", async () => {
    //Set bot card information
    bot.user.setPresence({
      activities: [{ name: "VGM!", type: ActivityType.Listening }],
      status: "Downloading ALL THE INTERNET!",
    });
    console.log("This bot is active!");
    // Set check chron here
  });
  botAccess = bot;
  sendDailyEmbed.start();
  //checkTournamentBattleReactions.start();
  //checkTournamentBattleReactions2.start();
  return bot;
}

function GetBot() {
  return botAccess;
}

function SetupEvents(bot) {
  const eventsPath = path.join(__dirname, "public", "events");
  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
      bot.once(event.name, (...args) => event.execute(...args));
    } else {
      bot.on(event.name, (...args) => event.execute(...args));
    }
  }
}

function AddCommandsToBot(bot) {
  bot.commands = new Collection();
  const commandsPath = path.join(__dirname, "public", "commands");
  const commandFiles = nodefs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      bot.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

async function DeployCommands() {
  const commands = [];
  // Grab all the command files from the commands directory you created earlier
  const commandFiles = fs
    .readdirSync("./public/commands")
    .filter((file) => file.endsWith(".js"));

  // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
  for (const file of commandFiles) {
    const command = require(`./public/commands/${file}`);
    commands.push(command.data.toJSON());
  }

  // Construct and prepare an instance of the REST module
  const rest = new REST({ version: "10" }).setToken(process.env.BOT_KEY);

  // and deploy your commands!
  (async () => {
    try {
      console.log(
        `Started refreshing ${commands.length} application (/) commands.`
      );

      // The put method is used to fully refresh all commands in the guild with the current set
      const data = await rest.put(
        Routes.applicationCommands("1075910273044590713"),
        {
          body: commands,
        }
      );

      console.log(
        `Successfully reloaded ${data.length} application (/) commands.`
      );
    } catch (error) {
      // And of course, make sure you catch and log any errors!
      console.error(error);
    }
  })();
}
