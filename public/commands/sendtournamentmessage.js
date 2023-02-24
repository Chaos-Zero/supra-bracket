const { SlashCommandBuilder } = require("discord.js");
const { setTimeout } = require("timers/promises");

const fs = require("fs");

eval(fs.readFileSync("./public/main.js") + "");
eval(fs.readFileSync("./public/embeds/imagebuilder.js") + "");
eval(fs.readFileSync("./public/embeds/gifcreator.js") + "");

eval(fs.readFileSync("./public/embeds/dailymessages.js") + "");
eval(fs.readFileSync("./public/utils/messageutils.js") + "");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("send-daily-battle")
    .setDescription("Sends the next round to the tournament channel"),
  async execute(interaction) {
    var channelMessage = await interaction.reply("Constructing Embed");

    // Future proofing the method but just hard coding the value for now
    const numberOfContestants = 3;

    // Would pass in tournament name from this slash command in the future
    // Example Access for first entry in current round:
    //    tournamentRoundDetails[0][0].name
    let tournamentRoundDetails = await GetNextTournamentRound(
      GetDb(),
      "bestvgm2022awards",
      numberOfContestants
    );

    const youtubeUrls = [
      tournamentRoundDetails[0][0].link,
      tournamentRoundDetails[0][1].link,
      tournamentRoundDetails[0][2].link,
    ];

    downloadImages(youtubeUrls);

    //);
    const constructGifAndSendEmbed = async () => {
      createGif("neuquant", interaction);
      let reactionDetails = [];
      await GetLastMessageDetailsFromChannelName(
        "best-vgm-2022-awards",
        interaction,
        reactionDetails
      ).then(async () => {
        await setTimeout(15000);
        SendDailyEmbed(interaction, "bestvgm2022awards", tournamentRoundDetails, reactionDetails);
      });
      // await createGif("neuquant", youtubeImages);
    };
    //await SaveReactionPoints(reactionDetails);
    await constructGifAndSendEmbed();
    //var gif = "./public/commands/gif/img.gif";
    //await interaction.followUp({
    //    files: [gif],
    //  });
  },
};
