const { Client, ButtonBuilder, EmbedBuilder } = require("discord.js");
const { ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const fs = require("fs");
const sleep = require("util").promisify(setTimeout);
eval(fs.readFileSync("./public/utils/messageutils.js") + "");
eval(fs.readFileSync("./public/embeds/gifcreator.js") + "");
eval(fs.readFileSync("./public/database/read.js") + "");
eval(fs.readFileSync("./public/database/write.js") + "");

var low = require("lowdb");
var FileSync = require("lowdb/adapters/FileSync");
var adapter = new FileSync(".data/db.json");

const db = low(adapter);

async function UpodateDBWithEntries(
  db,
  tournamentTableName,
  tournamentRoundDetails,
  previousDaysPoints
) {
  var updates = [];
  console.log(
    "How many values we're inserting: " + tournamentRoundDetails[0].length
  );
  console.log("Who vote for A as first? " + previousDaysPoints[1][0].first);
  for (var i = 0; i < tournamentRoundDetails[0].length; i++) {
    var updateParams = {
      name: tournamentRoundDetails[1][i].name,
      link: tournamentRoundDetails[1][i].link,
      battle: tournamentRoundDetails[1][i].battle,
      points: Object.values(previousDaysPoints[0])[i],
      hasTakenPlace: true,
      usersFirstPick: previousDaysPoints[1][i].first,
      usersSecondPick: previousDaysPoints[1][i].second,
      usersDidNotPlace: previousDaysPoints[1][i].last,
    };
    updates.push(updateParams);
  }
  console.log(updates);
  UpdateBattleResults(
    db,
    tournamentTableName,
    tournamentRoundDetails[2],
    updates
  );
  UpdateAlertedUsers(db, tournamentTableName, tournamentRoundDetails[2]);
}

async function SendDailyEmbed(
  guild,
  tournamentTableName,
  tournamentRoundDetails,
  reactionDetails,
  gifName
) {
  const channel = await GetChannelByName(guild, process.env.TOURNAMENT_CHANNEL);
  let previousMessage = await GetLastMessageInChannel(channel);

  var previousDaysPoints = await CalculateReactionPoints(reactionDetails);
  await sleep(500);

  //[0: entry1Tally, 1: entry2Tally, 2: entry3Tally

  console.log(
    "Checking points after timeout " + Object.keys(previousDaysPoints[0])[1]
  );

  var entries = [
    {
      name: tournamentRoundDetails[1][0].name,
      points: Object.values(previousDaysPoints[0])[0],
      id: 0,
    },
    {
      name: tournamentRoundDetails[1][1].name,
      points: Object.values(previousDaysPoints[0])[1],
      id: 1,
    },
    {
      name: tournamentRoundDetails[1][2].name,
      points: Object.values(previousDaysPoints[0])[2],
      id: 2,
    },
  ];

  console.log(
    "Points out of order" +
      entries[0].points +
      " " +
      "points: " +
      Object.values(previousDaysPoints[0])[1]
  );
  var sortedEntries = entries.sort((r1, r2) =>
    r1.points > r2.points ? 1 : r1.points < r2.points ? -1 : 0
  );
  sortedEntries = sortedEntries.reverse();
  var links = [tournamentRoundDetails[1][parseInt(sortedEntries[0].id)].link];
  const d = new Date();
  let imgName = (Math.random() + 1).toString(36).substring(7);
  downloadImages(links, imgName).then(async () => {
    // Check for a draw

    /*
     var prevEmbed = new EmbedBuilder()
        //.setTimestamp(Date.now() + 1)
        .setTitle("1st Place: " + sortedEntries[0].name + "")
        .setAuthor({
          name: "Previous Battle Winner",
          iconURL:
            "https://cdn.glitch.global/485febab-53bf-46f2-9ec1-a3c597dfaebe/SD%20Logo.png?v=1676855711752",
        })
        .setColor("0xffffff")

        .setDescription("Points: " + sortedEntries[0].points)
        .setImage(previousWinnerPath)
        .setFooter({
          text:
            "2nd Place: " +
            sortedEntries[1].name +
            " | Points: " +
            sortedEntries[1].points +
            "\n3rd Place: " +
            sortedEntries[2].name +
            " | Points: " +
            sortedEntries[2].points,
        });
        */
    var isATie = sortedEntries[0].points == sortedEntries[1].points;
    var prevEmbed = new EmbedBuilder();
    if (isATie) {
      prevEmbed
        .setAuthor({
          name: "Previous Battle Update",
          iconURL:
            "https://cdn.glitch.global/485febab-53bf-46f2-9ec1-a3c597dfaebe/SD%20Logo.png?v=1676855711752",
        })
        .setTitle(
          ":warning: The previous battle has resulted in a draw! :warning:"
        )
        .setDescription(
          "Please reconsider your votes for our previous round if you have voted for third place.\n" +
            "The two songs in contention are:\n" +
            sortedEntries[0].name +
            " with " +
            sortedEntries[0].points +
            " points\nand\n" +
            sortedEntries[1].name +
            " with " +
            sortedEntries[1].points +
            " points." +
            "\nThe Previous round has had a further 24 hours added. Thank you for your cooperation.\n" +
            "-The SupraDarky Team"
        );
    } else {
      const getMax = (object) => {
        let max = Math.max(...Object.values(object));
        return Object.keys(object).filter((key) => object[key] == max);
      };

      var previousWinner = getMax(previousDaysPoints[0]);

      console.log(
        "Image for previous winner: " +
          tournamentRoundDetails[1][parseInt(sortedEntries[0])]
      );

      const previousWinnerPath =
        "https://sd-dev-bot.glitch.me/commands/gif/input/" + imgName + ".jpg";
      // Discord caches images so we have to change the name each day
      // Just going to use the date
      await sleep(3000);

      let day = d.getDay();

      var timeUntilNextRound =
        day == 5
          ? "<t:" + GetTimeInEpochStamp(72) + ":R>"
          : "<t:" + GetTimeInEpochStamp(24) + ":R>";

      console.log(timeUntilNextRound);

      prevEmbed
        //.setTimestamp(Date.now() + 1)
        .setTitle("1st Place: " + sortedEntries[0].name + "")
        .setAuthor({
          name: "Previous Battle Winner",
          iconURL:
            "https://cdn.glitch.global/485febab-53bf-46f2-9ec1-a3c597dfaebe/SD%20Logo.png?v=1676855711752",
        })
        .setColor("0xffffff")

        .setDescription("Points: " + sortedEntries[0].points)
        .setImage(previousWinnerPath)
        .setFooter({
          text:
            "2nd Place: " +
            sortedEntries[1].name +
            " | Points: " +
            sortedEntries[1].points +
            "\n3rd Place: " +
            sortedEntries[2].name +
            " | Points: " +
            sortedEntries[2].points,
        });
    }

    const gifPath =
      "https://sd-dev-bot.glitch.me/commands/gif/output/" + gifName + ".gif";

    var title =
      "*Previous Battle Results*:\n**1st place: " +
      tournamentRoundDetails[1][parseInt(previousWinner)].name +
      " - " +
      Object.values(previousDaysPoints[0])[0] +
      " points\n2nd place Blah points\n3rd place blash points\n";

    var embed = new EmbedBuilder()
      //.setTimestamp(Date.now() + 1)
      .setTitle(
        "Round " +
          tournamentRoundDetails[2] +
          " - Battle " +
          tournamentRoundDetails[0][0].battle
      )
      .setAuthor({
        name: "Best VGM 2022",
        iconURL:
          "https://cdn.glitch.global/485febab-53bf-46f2-9ec1-a3c597dfaebe/SD%20Logo.png?v=1676855711752",
      })
      .setColor("0xffff00")
      //.setDescription(
      //"\n**TODAY'S BATTLE:** Vote by tomorrow, 1:00 PM EST, in x hours"
      //)
      .addFields(
        {
          //name: "\u200B",
          name: "**TODAY'S BATTLE:** Voting for this battle ends <t:" + timeUntilNextRound + ":R>" ,
          value: "------------------------------------", //"\u200B",
        },
        {
          name: `A. ` + tournamentRoundDetails[0][0].name,
          value: tournamentRoundDetails[0][0].link,
        },
        {
          name: `B. ` + tournamentRoundDetails[0][1].name,
          value: tournamentRoundDetails[0][1].link,
        },
        {
          name: `C. ` + tournamentRoundDetails[0][2].name,
          value: tournamentRoundDetails[0][2].link,
        },
        //{
        //  name: "\u200B",
        //  value: "\u200B",
        //},
        {
          name: `------------------------------------`,
          value: `Vote for your ranked order of preference by reacting to this post:`,
          //value: `Ranked Order for voting purposes:`,
        },
        {
          name: `...1️⃣...`,
          value: `A>B>C`,
          inline: true,
        },
        {
          name: `...2️⃣...`,
          value: `A>C>B     `,
          inline: true,
        },
        {
          name: `...3️⃣...`,
          value: `B>A>C `,
          inline: true,
        },
        {
          name: `...4️⃣...`,
          value: `B>C>A`,
          inline: true,
        },
        {
          name: `...5️⃣...`,
          value: `C>A>B`,
          inline: true,
        },
        {
          name: `...6️⃣...`,
          value: `C>B>A`,
          inline: true,
        }
      )
      //  .setTitle(`${title1}`)
      //.setDescription("Blah blah")
      .setThumbnail(
        gifPath
        //"https://cdn.glitch.global/485febab-53bf-46f2-9ec1-a3c597dfaebe/sd-img.jpeg?v=1676586931016"
      );

    UpodateDBWithEntries(
      db,
      tournamentTableName,
      tournamentRoundDetails,
      previousDaysPoints
    );

    //channel.send({
    //  content: "Hello all and <@&1077345571221807244>",
    //  components: [row],
    //});
    //RemoveBotReactions(previousMessage);
    channel
      .send({
        content: "Hello all and <@&1077345571221807244>",
        embeds: [prevEmbed, embed],
      })
      .then((embedMessage) => {
        embedMessage.react("1️⃣");
        embedMessage.react("2️⃣");
        embedMessage.react("3️⃣");
        embedMessage.react("4️⃣");
        embedMessage.react("5️⃣");
        embedMessage.react("6️⃣");
      });
  });
}
async function CreateAndSendDailyBattleMessages(interaction = "") {
  const numberOfContestants = 3;
  let gifName = Math.random().toString(36).slice(2, 7);
  //);
  CheckAndDealWithTie();
  console.log("We have loaded CreateAndSendDailyBattleMessages method");
  const constructGifAndSendEmbed = async () => {
    // Would pass in tournament name from this slash command in the future
    // Example Access for first entry in current round:
    //    tournamentRoundDetails[0][0].name
    var guildObject;
    if (interaction == "") {
      guildObject = await GetBot().guilds.cache.get(process.env.GUILD_ID);
    } else {
      guildObject = await interaction.member.guild;
    }
    let reactionDetails = [];
    await GetLastMessageDetailsFromChannelName(
      process.env.TOURNAMENT_CHANNEL,
      guildObject,
      reactionDetails
    ).then(async () => {
      await sleep(8000);

      SendDailyEmbed(
        guildObject,
        process.env.TOURNAMENT_NAME,
        tournamentRoundDetails,
        reactionDetails,
        gifName
      );
    });
    // await createGif("neuquant", youtubeImages);
  };
  //await SaveReactionPoints(reactionDetails);
  // [todaysContestants, lastContestants, currentRound]
  console.log("Getting tournamentRoundDetails");
  let currentRound;
  let tournamentRoundDetails = await GetNextTournamentRound(
    db,
    process.env.TOURNAMENT_NAME,
    numberOfContestants
  );

  UpdateCurrentBattleToTrue(
    db,
    process.env.TOURNAMENT_NAME,
    tournamentRoundDetails[3]
  );
  console.log("Are we getting here");
  //[todaysContestants, lastContestants, currentRound, startingRound]
  console.log(tournamentRoundDetails[1][1]);
  console.log(
    "Round before: " +
      tournamentRoundDetails[3] +
      "\nRound now: " +
      tournamentRoundDetails[2]
  );
  if (tournamentRoundDetails[2] !== tournamentRoundDetails[3]) {
    UpdateRoundCompleted(
      db,
      process.env.TOURNAMENT_NAME,
      tournamentRoundDetails[3]
    );
  }

  const youtubeUrls = [
    tournamentRoundDetails[0][0].link,
    tournamentRoundDetails[0][1].link,
    tournamentRoundDetails[0][2].link,
  ];

  downloadImages(youtubeUrls).then(async () => {
    // Discord caches images so we have to change the name each day
    // Just going to use the date
    await sleep(3000);

    const d = new Date();
    //let gifname = d.toISOString().slice(0, 10);

    console.log("Making gif");
    createGif("neuquant", interaction, gifName).then(async () => {
      await sleep(2000);

      constructGifAndSendEmbed();
      //var gif = "./public/commands/gif/img.gif";
      //await interaction.followUp({
      //    files: [gif],
      //  });
    });
  });
}

async function CheckAndDealWithTie() {
  var lastBattleTie = wasLastBattleTie(db, bestvgm2022awards, currentRound);
  if (lastBattleTie) {
    channel = await GetChannelByName(
      interaction.member.guild,
      process.env.TOURNAMENT_NAME
    );
    channel.messages.fetch(`messageId`).then((message) => {
      return message.embeds;
    });
  }
}

function GetTimeInEpochStamp(hoursToAdd = 0) {
  var date = new Date(); // Generic JS date object
  var unixDate = Math.floor(date.getTime() / 1000) + 60 * 60 * hoursToAdd;
  return unixDate.toString();
}
