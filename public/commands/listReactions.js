const { SlashCommandBuilder } = require("discord.js");

const fs = require("fs");
eval(fs.readFileSync("./public/utils/messageutils.js") + "");
eval(fs.readFileSync("./public/embeds/dailymessages.js") + "");
//eval(fs.readFileSync("./public/embeds/dailymessages.js") + "");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reactions")
    .setDescription("Test command."),
  async execute(interaction) {
    // interaction.user is the object representing the User who ran the command
    // interaction.member is the GuildMember object, which represents the user in the specific guild

    await GetLastMessageDetailsFromChannelName(
      "best-vgm-2022-awards",
      interaction
    );

    var channel = await GetChannelByName(
      interaction.member.guild,
      "best-vgm-2022-awards"
    );

    //SendDailyEmbed(channel);
  },
};
