const { Client, ButtonBuilder, EmbedBuilder } = require("discord.js");
const { ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const fs = require("fs");
const sleep = require("util").promisify(setTimeout);
eval(fs.readFileSync("./public/utils/messageutils.js") + "");
eval(fs.readFileSync("./public/embeds/gifcreator.js") + "");
eval(fs.readFileSync("./public/database/read.js") + "");
eval(fs.readFileSync("./public/database/write.js") + "");


async function ReturnReactionTotals (db, interaction) {
  // Would pass in tournament name from this slash command in the future
  // Example Access for first entry in current round:
  //    tournamentRoundDetails[0][0].name
  var guildObject;
  if (interaction == "") {
    guildObject = await db.guilds.cache.get(process.env.GUILD_ID);
  } else {
    guildObject = await interaction.member.guild;
  }
  let reactionDetails = [];
  await GetLastMessageDetailsFromChannelName(
    process.env.TOURNAMENT_CHANNEL,
    guildObject,
    reactionDetails
  ).then((eactionDetails)=>{
    return reactionDetails;
  })
  // await createGif("neuquant", youtubeImages);
};

async function SendMessageForDuplicateVotes( bot, db ) {
    var guild = await bot.guilds.cache.get(process.env.GUILD_ID);
    console.log(guild);
    var tournamentChannel = await GetChannelByName(
      guild,
      process.env.TOURNAMENT_CHANNEL
    );
    var tournamentChatChannel = await GetChannelByName(
      guild,
      process.env.TOURNAMENT_CHAT_CHANNEL
    );
  
    console.log(
      "Tourn Channel: " +
        tournamentChannel +
        "\nChat Channel : " +
        tournamentChatChannel
    );
    await sleep(600);
    let battleMessage = await GetLastMessageInChannel(tournamentChannel);
    let currentRound = await GetCurrentRound(db, process.env.TOURNAMENT_NAME);
    await sleep(600);
    let duplicateVotesUserIds = await CheckForReactionDuplicates(battleMessage);
    let alertedUsers = await GetAlertedUsers(
      db,
      process.env.TOURNAMENT_NAME,
      currentRound
    );
    await sleep(10000);
    console.log("Users from DB: " + alertedUsers);
    duplicateVotesUserIds = duplicateVotesUserIds.filter(
      (item) => item !== process.env.BOT_ID
    );
  
    for (const user of alertedUsers) {
      duplicateVotesUserIds = duplicateVotesUserIds.filter(
        (item) => item !== user
      );
    }
    alertedUsers.push.apply(alertedUsers, duplicateVotesUserIds);
  
    UpdateAlertedUsers(
      db,
      process.env.TOURNAMENT_NAME,
      currentRound,
      alertedUsers
    );
  
    console.log("duplicateVotesUserIds: " + duplicateVotesUserIds);
    if (duplicateVotesUserIds.length > 0) {
      var message =
        "The following members currently have more than one option selected on the current battle:\n ";
      var messageEnd =
        "\nPlease reduce your selection to one vote before voting ends on this battle.\nThank You! - SupraDarky Team";
  
      var midMessageString = "";
  
      for (const userId of duplicateVotesUserIds) {
        midMessageString += "> <@" + userId + ">\n";
      }
  
      const finalMessage = message + midMessageString + messageEnd;
  
      tournamentChatChannel.send(finalMessage);
    }
  }

function DetermineWinnerFromTie(){
  
}

async function ProcessReactionData(tournamentRoundDetails, reactionDetails){
    /*
    tournamentRoundDetails
    todaysContestants, lastContestants, currentRound, startingRound
    */
    /* 
    previousDaysPoints: 
    [{ 0: entry1Tally, 1: entry2Tally, 2: entry3Tally }, votesPerGame];
          votesPerGame: [votesForA, votesForB, votesForC];
          votesForX = { first: votedXFirst,
                        second: votedXSecond,
                        last: didNotVoteX,
                      }
    */
   var promise =  new Promise((resolve) => {
    var previousDaysPoints = await CalculateReactionPoints(reactionDetails);
    await sleep(500);
                      
    var previousDaysEntries = [
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

    var sortedPreviousDays = previousDaysEntries.sort((r1, r2) =>
      r1.points > r2.points ? 1 : r1.points < r2.points ? -1 : 0
    );
    sortedPreviousDays = sortedPreviousDays.reverse();

    var isATie = sortedPreviousDays[0].points == sortedPreviousDays[1].points;

    if (!isATie){
      var fistPlaceSecondVotesFromThirdPlace = 0;
      var secondPlaceSecondVotesFromThirdPlace = 0;
      for (const user of previousDaysPoints[1][sortedPreviousDays[2].id].first)
        if (previousDaysPoints[1][sortedPreviousDays[0].id].second.includes(user)){
          fistPlaceSecondVotesFromThirdPlace += 1
        } else if (previousDaysPoints[1][sortedPreviousDays[1].id].second.includes(user)){
          secondPlaceSecondVotesFromThirdPlace += 1;
        }
         var firstPlace =  (fistPlaceSecondVotesFromThirdPlace > secondPlaceSecondVotesFromThirdPlace )? sortedPreviousDays[0] : sortedPreviousDays[1]
         var secondPlace =  (fistPlaceSecondVotesFromThirdPlace > secondPlaceSecondVotesFromThirdPlace )? sortedPreviousDays[1] : sortedPreviousDays[0]  
         sortedPreviousDays[0] = firstPlace
         sortedPreviousDays[1] = secondPlace
        
      }
      
      resolve(sortedPreviousDays);
    });
    return promise
    }
  
  async function SendDailyEmbed(
    guild,
    tournamentTableName,
    tournamentRoundDetails,
    sortedPreviousDaysEntries,
    gifName
  ) {
    const channel = await GetChannelByName(guild, process.env.TOURNAMENT_CHANNEL);
    //let previousMessage = await GetLastMessageInChannel(channel);

     var links = [tournamentRoundDetails[1][parseInt(sortedPreviousDaysEntries[0].id)].link];
     const d = new Date();
     let imgName = (Math.random() + 1).toString(36).substring(7);
 
     
     console.log(
       "Image for previous winner: " +
         tournamentRoundDetails[1][parseInt(sortedPreviousDaysEntries[0])]
     );

    downloadImages(links, imgName).then(async () => {
     
      
      var prevEmbed = new EmbedBuilder();
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
          .setTitle("1st Place: " + sortedPreviousDaysEntries[0].name + "")
          .setAuthor({
            name: "Previous Battle Winner",
            iconURL:
              "https://cdn.glitch.global/485febab-53bf-46f2-9ec1-a3c597dfaebe/SD%20Logo.png?v=1676855711752",
          })
          .setColor("0xffffff")
  
          .setDescription("Points: " + sortedPreviousDaysEntries[0].points)
          .setImage(previousWinnerPath)
          .setFooter({
            text:
              "2nd Place: " +
              sortedPreviousDaysEntries[1].name +
              " | Points: " +
              sortedPreviousDaysEntries[1].points +
              "\n3rd Place: " +
              sortedPreviousDaysEntries[2].name +
              " | Points: " +
              sortedPreviousDaysEntries[2].points,
          });
      
  
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
  
        UpdateDbWithBattleResults(
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

  async function CreateAndSendDailyBattleMessages(bot, db, interaction = "") {
    
    const numberOfContestants = 3;
    let gifName = Math.random().toString(36).slice(2, 7);
    //);
    //await CheckAndDealWithTie();
    console.log("We have loaded CreateAndSendDailyBattleMessages method");
    
    //await SaveReactionPoints(reactionDetails);
    // [todaysContestants, lastContestants, currentRound]
    console.log("Getting tournamentRoundDetails");
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
  
        await ReturnReactionTotals(db, interaction).then((reactionDetails)=>{
          ProcessReactionData(tournamentRoundDetails, reactionDetails).then((sortedPreviousDaysEntries) => {
            SendDailyEmbed(
              guildObject,
              process.env.TOURNAMENT_NAME,
              tournamentRoundDetails,
              sortedPreviousDaysEntries,
              gifName
            );
            var battleNumber = (parseInt(tournamentRoundDetails[0][0].battle) < 3) ? 1 :  Math.ceil(parseInt(tournamentRoundDetails[0][0].battle)/3);
            var winnerEntryForNextRound = 
            {
              name: sortedPreviousDaysEntries[0].name,
              link: [tournamentRoundDetails[1][parseInt(sortedPreviousDaysEntries[0].id)].link],
              battle: battleNumber,
              points: 0,
              hasTakenPlace: false,
              usersFirstPick: [],
              usersSecondPick: [],
              usersDidNotPlace: [],
            }
            AddWinnerToNextRound(db, process.env.TOURNAMENT_NAME, tournamentRoundDetails[2], winnerEntryForNextRound)
          })
          //CreateDailyEmbedContent(tournamentRoundDetails, reactionDetails);
        })
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
