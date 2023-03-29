// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
const express = require("express");
const fs = require("fs");
const { Events } = require("discord.js");
const cron = require("cron");

eval(fs.readFileSync("./public/main.js") + "");
eval(fs.readFileSync("./public/utils/messageutils.js") + "");
eval(fs.readFileSync("./public/tournament/buttonfunctions.js") + "");
eval(fs.readFileSync("./public/api/vgmdb/buttonfunctions.js") + "");
eval(fs.readFileSync("./public/api/vgmdb/vgmdb.js") + "");

const app = express();

//Set up bot
const bot = CreateBot();

var db = GetDb();

var populatedDb = GetLocalDb();

AddCommandsToBot(bot);

SetupEvents(bot);

DeployCommands();

var count = 10;

// Deal with Discord Messages
bot.on("messageCreate", async (message) => {
  //console.log(message)
  let thisChannel = message.channel;
});

//bot.on("messageReactionAdd", async (reaction, user) => {
//  if (reaction.partial) {
//    // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
//    try {
//      await reaction.fetch().then((reaction) => {
//        let thisChannel = reaction.message.channel;
//        if (
//          user.id !== bot.user.id &&
//          thisChannel.name == process.env.TOURNAMENT_NAME
//        ) {
//          CheckReactions(reaction, user);
//        }
//      });
//    } catch (error) {
//      console.error("Something went wrong when fetching the message:", error);
//      // Return as `reaction.message.author` may be undefined/null
//      return;
//    }
//  } else {
//    let thisChannel = reaction.message.channel;
//    if (user.id !== bot.user.id && thisChannel.name == process.env.TOURNAMENT_NAME) {
//      CheckReactions(reaction, user);
//    }
//  }
//});

// make all the files in 'public' available
// https://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// https://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile("/public/index.html");
});

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

bot.on(Events.InteractionCreate, (interaction) => {
  console.log("We got one!");
  console.log(interaction.customId);
  console.log("album-dropdown-" + String(interaction.user.id));
  var isUserMatch =
    new String(interaction.customId).trim() ==
    new String("album-dropdown-" + String(interaction.user.id)).trim();

  console.log(isUserMatch);
  if (interaction.isStringSelectMenu()) {
    if (isUserMatch && interaction.customId.includes("album-dropdown-")) {
      (async () => {
        console.log("Running through Event coordinator");
        await handleVgmdbDropdownSelection(interaction);
      })().catch(console.error);
    } else {
      (async () => {
        await interaction.reply({
          content:
            "Sorry, this dropdown is reserved for the user who spawned the message.",
          ephemeral: true,
        });
      })().catch(console.error);
    }
  } else {
    if (!interaction.isButton()) return;
    // We need to catch the error coming back when a user reactions twice when revoting
    (async () => {
      //console.log(interaction)
      const splitButtonName = interaction.customId.split("-");
      console.log("the split buttoncvxcv" + splitButtonName);
      if (splitButtonName[0] == "album") {
        await handleVgmdbButtonPress(interaction);
      } else {
        await handleButtonPress(interaction, db, populatedDb);
      }
    })().catch(console.error);
  }
  console.log("We're done with the button handling");
});
