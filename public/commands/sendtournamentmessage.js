const { SlashCommandBuilder } = require("discord.js");
const { setTimeout } = require("timers/promises");

const fs = require("fs");

eval(fs.readFileSync("./public/main.js") + "");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("send-daily-battle")
    .setDescription("Sends the next round to the tournament channel"),
  async execute(interaction) {
    var channelMessage = await interaction.reply("Constructing Embed");
    // Future proofing the method but just hard coding the value for now
    CreateAndSendDailyBattleMessages(GetBot(), GetDb(), GetLocalDb())
  },
};
