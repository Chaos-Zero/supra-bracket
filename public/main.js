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
eval(fs.readFileSync("./public/utils/messageutils.js") + "");
eval(fs.readFileSync("./public/database/csv/csvfileutils.js") + "");

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

let populatedDb = GetDbTable(db, process.env.TOURNAMENT_NAME);

function refreshDb() {
  //db.read()
  console.log("Db's reloaded");
}

// If we want to pass this around, it needs to be in an object to pass the value by refernce, otherwise, it's just copied
global.userAlbumResults = new Map();

function GetLocalDb() {
  return populatedDb;
}

function CreateBot() {
  //LoadCsv();

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
  //oneOffJoke.start();
  //checkTournamentBattleReactions.start();
  //checkTournamentBattleReactions2.start();
  return bot;
}

function GetBot() {
  return botAccess;
}

//let sendDailyEmbed = new cron.CronJob("00 */1 * * * *", () => {
let sendDailyEmbed = new cron.CronJob("10 25 16 * * *", () => {
  //"25 32 00 * * 1-6"
  console.log("Sending Daily Message");
  db.read();
  populatedDb = GetDbTable(db, process.env.TOURNAMENT_NAME);
  CreateAndSendDailyBattleMessages(bot, db, populatedDb);
});

let oneOffJoke = new cron.CronJob("20 18 17 * * *", () => {
  //"25 32 00 * * 1-6"
  CreateAprilFools();
});
// fires Mon - Thurs, at 18:00:10 (1:00 PM EST)
//let sendFridayEmbed = new cron.CronJob('15 * 18 * * 5', test); // fires from Monday to Friday, every hour from 8 am to 16
//. let checkTournamentBattleReactions = new cron.CronJob("00 15 * * * *", () =>
//.   SendMessageForDuplicateVotes(GetBot(), db)
//. );
//. let checkTournamentBattleReactions2 = new cron.CronJob(
//.   "00 45 * * * *",
//.   SendMessageForDuplicateVotes(GetBot(), db)
//. );

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
