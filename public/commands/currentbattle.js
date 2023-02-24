const { SlashCommandBuilder } = require("discord.js");

const fs = require("fs");
eval(fs.readFileSync("./public/database/read.js") + "");
eval(fs.readFileSync("./public/embeds/dailymessages.js") + "");
eval(fs.readFileSync("./public/main.js") + "");


module.exports = {
  data: new SlashCommandBuilder()
    .setName("todays-battle")
    .setDescription("Print the battle today."),
  async execute(interaction) {
    // interaction.guild is the object representing the Guild in which the command was run
    let tournamentRoundDetails = await GetNextTournamentRound(GetDb(), "bestvgm2022awards", 3)
    await interaction.reply(
      `First track of the day is: ` + tournamentRoundDetails[0][0].name + '\nYesterdays first track was: ' + tournamentRoundDetails[1][0].name
    );
  },
};
