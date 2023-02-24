// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
const express = require("express");
const fs = require("fs");
const { Events } = require("discord.js");
const cron = require("node-cron");

eval(fs.readFileSync("./public/main.js") + "");

const app = express();

//Set up bot
const bot = CreateBot();

AddCommandsToBot(bot);

SetupEvents(bot);

DeployCommands();

var count = 10;

// Deal with Discord Messages
bot.on("messageCreate", (message) => {
  //console.log(message)
  let thisChannel = message.channel;
});

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

//var task = cron.schedule(
//  "* * * * *",
//  function () {
//    console.log("Posting every 15 seconds");
//  },
//  {
//    scheduled: false,
//  }
//);

//task.start();

function GetBot() {
  return bot;
}
