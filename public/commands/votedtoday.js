const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const fs = require("fs");
eval(fs.readFileSync("./public/main.js") + "");
eval(fs.readFileSync("./public/tournament/tournamentutils.js") + "");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("who-voted-for-what-today")
    .setDescription("Outputs who has voted for what today."),
  async execute(interaction) {
    let rawDb = GetDb();
    let populatedDb = GetLocalDb();

    rawDb.read();
    var votedTodayCollection = "";

    let currentRound = await rawDb
      .get("bestvgm2022awards")
      .find({ isCurrentRound: true })
      .value();

    if (currentRound) {
      votedTodayCollection = currentRound.votedToday;
    }

    var votedTodayCollection = await GetCurrentBattlesVotes(rawDb);
    console.log(votedTodayCollection);

    if (votedTodayCollection == "") {
      await interaction.reply(
        `There doesn't appear to be a battle running at this current time.`
      );
    } else {
      var outputMessage = "Here is todays list of Voters and Votes cast:\n\n| ";
      const guild = interaction.guild;
      const members = await guild.members.fetch();
      for (var user of votedTodayCollection) {
        var discordMember = members.find(
          (member) => member.id == user.memberId
        );

        var username =
          discordMember == undefined ? "" : discordMember.displayName;
        outputMessage += "**" + username + "**: `" + user.vote + "` | ";
      }
      console.log(outputMessage);
      interaction.reply(outputMessage);
    }
  },
};

function CreateLogEmbed(round, battle) {
  const exampleEmbed = new EmbedBuilder()
    .setColor(0x097969)
    .setTitle("Round: " + round + ", Battle: " + battle + " votes!")
    .setAuthor({
      name: "Best VGM 2022",
      iconURL:
        "https://cdn.glitch.global/485febab-53bf-46f2-9ec1-a3c597dfaebe/SD%20Logo.png?v=1676855711752",
    })
    .setDescription("Here's a break for for ")
    .setThumbnail("https://i.imgur.com/AfFp7pu.png")
    .addFields(
      {
        name: "<:ABC:1090369448185172028>",
        value: "Some value here",
        inline: false,
      },
      {
        name: "<:ACB:1090369449422499870>",
        value: "Some value here",
        inline: false,
      },
      {
        name: "<:BAC:1090369451549020321>",
        value: "Some value here",
        inline: false,
      },
      {
        name: "<:BCA:1090369452874412133>",
        value: "Some value here",
        inline: false,
      },
      {
        name: "<:CAB:1090369455533588540>",
        value: "Some value here",
        inline: false,
      },
      {
        name: "<:CBA:1090369457806909571>",
        value: "Some value here",
        inline: false,
      }
    )
    .addFields({
      name: "Inline field title",
      value: "Some value here",
      inline: true,
    })
    .setImage("https://i.imgur.com/AfFp7pu.png")
    .setTimestamp()
    .setFooter({
      text: "Some footer text here",
      iconURL: "https://i.imgur.com/AfFp7pu.png",
    });

  channel.send({ embeds: [exampleEmbed] });
}
