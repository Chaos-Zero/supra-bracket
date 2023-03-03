const { SlashCommandBuilder } = require("discord.js");
const { setTimeout } = require("timers/promises");

const fs = require("fs");
eval(fs.readFileSync("./public/embeds/dailymessages.js") + "");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("send-daily-battle")
    .setDescription("Sends the next round to the tournament channel"),
  async execute(interaction) {
    console.log("Eh");
    var channelMessage = await interaction.reply("Constructing Embed");
    console.log("AY");
    // Future proofing the method but just hard coding the value for now
    CreateAndSendDailyBattleMessages(interaction);
  },
};
