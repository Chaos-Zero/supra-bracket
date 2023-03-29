const fs = require("fs");
const sleep = require("util").promisify(setTimeout);

eval(fs.readFileSync("./public/main.js") + "");
eval(fs.readFileSync("./public/api/vgmdb/vgmdb.js") + "");

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");

const smallLoadingEmbed = new EmbedBuilder().setImage(
  "https://cdn.glitch.global/3f656222-6918-4bd9-9371-baaf3a2a9010/Domo-load-small.gif?v=1679713388809"
);

const loadingEmbed = new EmbedBuilder().setImage(
  "https://cdn.glitch.global/3f656222-6918-4bd9-9371-baaf3a2a9010/Domo-load.gif?v=1679712312250"
);

const noResultsEmbed = new EmbedBuilder().setImage(
  "https://cdn.glitch.global/3f656222-6918-4bd9-9371-baaf3a2a9010/domo-sweat-blank-messageno-results.gif?v=1679872181343"
);

var attempts = 0

module.exports = {
  data: new SlashCommandBuilder()
    .setName("vgmdb")
    .setDescription("Search for VGM released on VGMdb.net")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription(
          'Series, Game or Album to search. Use "quotation marks" for accurate results'
        )
        .setRequired(true)
    ),
  async execute(interaction) {
    const query = interaction.options.getString("query");

    await interaction.reply({
      content: "Looking for " + query,
      embeds: [loadingEmbed],
    });
    await SearchVgmdb(interaction, query, attempts);
  },
};

async function SearchVgmdb(interaction, query, attempts) {
  attempts += 1;
  await searchVGMdb(interaction, query, attempts).then(async (results) => {
    await sleep(2000);
    console.log("are we here?");
    //console.log(results.results)
    const checkIfResults =
      results?.results?.albums ?? await SearchVgmdb(interaction, query, attempts);
    if (checkIfResults == undefined) {
      return;
    }
    var isGameAvailable = await findValueInArray(
      results.results.albums,
      "category",
      "Game"
    );

    if (!isGameAvailable) {
      console.log("Time to say sorry");
      return await interaction.editReply({
        content: "Sorry, there were no results found for your query.",
        embeds: [noResultsEmbed],
      });
    }

    console.log("We have continuied on");
    var filteredResults = removeObjectsWithMismatch(
      results.results.albums,
      "category",
      "Game"
    );

    //await AddImgurlToResults(filteredResults);
    //console.log(filteredResults);
    userAlbumResults.set(interaction.user.id, {
      filteredResults,
      currentPage: 0,
      interaction: interaction,
    });
    var albumRange = filteredResults.length;
    if (results?.results?.albums == undefined || albumRange < 1) {
      return await interaction.editReply({
        content: "Sorry, there were no results found for your query.",
        embeds: [noResultsEmbed],
      });
    }

    console.log("Albums: " + albumRange);

    var url = "https://vgmdb.net/" + filteredResults[0].link;
    console.log(url);
    getAlbumCoverArtUrl(url).then(async (imgUrl) => {
      var imageExtension = imgUrl.split(".");
      var formattedImgUrl =
        imageExtension == "gif"
          ? "https://cdn.glitch.global/3f656222-6918-4bd9-9371-baaf3a2a9010/Album%20Art.png?v=1679783448288"
          : imgUrl;
      const embed = await createVGMdbEmbed(
        filteredResults[0],
        formattedImgUrl,
        albumRange
      );
      //const embed = await createVGMdbEmbed(filteredResults[0], albumRange);
      const buttons = createPaginationButtons(interaction.member.id);
      const dropdown = createDropdown(interaction.member.id, 0);
      const topRow = new ActionRowBuilder().addComponents(dropdown);
      const row = new ActionRowBuilder().addComponents(buttons);

      interaction.editReply({
        content:
          "We have found **" +
          filteredResults.length +
          " entires** for the search " +
          query,
        embeds: [embed],
        components: [topRow, row],
      });

      // const collector = interaction.channel.createMessageComponentCollector({
      //   filter: (i) =>
      //     i.isStringSelectMenu() &&
      //     i.customId === "album-dropdown-" + interaction.user.id,
      //   time: 60000, // time in ms
      // });
      //
      // // Listen for user input and ask for new value
      // collector.on("collect", async (i) => {
      //   const category = i.values[0];
      //   console.log("Is this the index? " + category);
      //   await i.deferUpdate();
      //   handleVgmdbDropdownSelection(i, category);
      // });
    });
  });
}

function removeObjectsWithMismatch(albumsArray, category, game) {
  return albumsArray.filter((obj) => obj[category] == game);
}

async function AddImgurlToResults(filteredResults) {
  const requests = filteredResults.map(async (result) => {
    var url = "https://vgmdb.net/" + result.link;
    getAlbumCoverArtUrl(url).then(async (imgUrl) => {
      result.imgUrl = imgUrl;
      console.log(result);
      console.log(result.imgUrl);
    });
  });
  const asyncResults = await Promise.all(requests);
  return asyncResults;
}

async function findValueInArray(array, fieldName, valueToFind) {
  for (const obj of array) {
    if (obj[fieldName] === valueToFind) {
      console.log("We found something");
      return true;
    }
  }
  console.log("We didn't find something");
  return false;
}

/*
async function handleVgmdbDropdownSelection(interaction) {
  var value = interaction.values[0];

  var newIndex = 0;
  if (value == "album-prev" || value == "album-next") {
    console.log("Someone pressed next or previous");
    const currentPage =
      parseInt(
        interaction.message.components[0].components[0].options[1].value.split(
          "-"
        )[1]
      ) / 10;
    const newPage = value === "album-prev" ? currentPage - 1 : currentPage + 1;
    const dropdown = createDropdown(interaction.member.id, newPage);
    const buttons = createPaginationButtons(interaction.member.id);
    const topRow = new ActionRowBuilder().addComponents(dropdown);
    const row = new ActionRowBuilder().addComponents(buttons);

    return await interaction.editReply({ components: [topRow, row] });
  } else {
    await interaction.editReply({ embeds: [smallLoadingEmbed] });
    const { results, currentPage } = getResultsAndPage(interaction);

    const valueArray = value.split("-");
    var index = valueArray[1];

    console.log("The value from the interaction: " + value);
    console.log("The results: " + results);
    console.log("The Page: " + currentPage);

    var entryIndex = parseInt(index);
    var url = "https://vgmdb.net/" + results[entryIndex].link;

    getAlbumCoverArtUrl(url).then(async (imgUrl) => {
      console.log("Here is imgurl: " + imgUrl);
      var imageExtension = imgUrl.split(".");
      console.log(imageExtension);
      var formattedImgUrl =
        imageExtension[1] == "gif"
          ? "https://cdn.glitch.global/3f656222-6918-4bd9-9371-baaf3a2a9010/Album%20Art.png?v=1679783448288"
          : imgUrl;
      const newEmbed = createVGMdbEmbed(
        results[entryIndex],
        formattedImgUrl,
        results.length
      );

      newEmbed.setFooter({
        text:
          "Page " +
          (parseInt(entryIndex) + parseInt(1)) +
          " of " +
          results.length,
      });

      // Update the stored page number
      updatePage(interaction.user.id, entryIndex);

      await interaction.editReply({ embeds: [newEmbed] });
    });
  }
}


async function handleVgmdbDropdownSelection(interaction, newIndex) {
  console.log("We're in handle Vgmdb dropdown");
  
  const userResult = userAlbumResults.get(interaction.user.id);
  console.log(userResult)
  
  var originInteraction = userResult.interaction;

  await interaction.editReply({ embeds: [smallLoadingEmbed] });

  const { results, currentPage } = getResultsAndPage(interaction);

  var url = "https://vgmdb.net/" + results[newIndex].link;
  console.log(url);
  getAlbumCoverArtUrl(url).then(async (imgUrl) => {
    console.log("Here is imgurl: " + imgUrl);
    var imageExtension = imgUrl.split(".");
    console.log(imageExtension);
    var formattedImgUrl =
      imageExtension[1] == "gif"
        ? "https://cdn.glitch.global/3f656222-6918-4bd9-9371-baaf3a2a9010/Album%20Art.png?v=1679783448288"
        : imgUrl;
    const newEmbed = createVGMdbEmbed(
      results[newIndex],
      formattedImgUrl,
      results.length
    );

    newEmbed.setFooter({
      text:
        "Page " + (parseInt(newIndex) + parseInt(1)) + " of " + results.length,
    });

    // Update the stored page number
    updatePage(interaction.user.id, newIndex);
    console.log("Is it this reply?")
    await interaction.editReply({ embeds: [newEmbed] });
  });
}
*/
