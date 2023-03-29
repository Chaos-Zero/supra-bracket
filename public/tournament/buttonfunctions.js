const {
  ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
} = require("discord.js");
const fs = require("fs");

eval(fs.readFileSync("./public/database/write.js") + "");

async function handleButtonPress(interaction, db, populatedDb) {
  var foundEntry = false;
  const splitButtonName = interaction.customId.split("-");
  console.log(splitButtonName);

  console.log("Entering");
  //Button -> a1-roundnumber-battlenumber
  var startingRound = 0;
  var currentBattle = 0;

  loop1: for (var item of populatedDb) {
    if (item.isCurrentRound == true) {
      startingRound = parseInt(item.round);
      loop2: for (var i = 0; i < item.entries.length; i++) {
        if (item.entries[i].hasTakenPlace == false) {
          currentBattle = parseInt(item.entries[i].battle);
          break loop1;
        }
      }
    }
  }

  console.log(
    "startingRound: " +
      startingRound +
      "\ncurrentBattle: " +
      currentBattle +
      "\nButton Round: " +
      splitButtonName[1] +
      "\nButton Battle: " +
      splitButtonName[2]
  );

  if (splitButtonName[0] != "resetVote") {
    if (
      parseInt(splitButtonName[1]) != parseInt(startingRound) ||
      parseInt(splitButtonName[2]) != parseInt(currentBattle)
    ) {
      await interaction
        .reply({
          content:
            "This battle has already concluded.\nPlease vote on the most up-to-date battle.",
          ephemeral: true,
        })
        .then(() => console.log("Reply sent."))
        .catch((_) => null);
      return 0;
    }
  }
  await IsSecondVote(interaction, populatedDb, splitButtonName).then(
    async (foundEntryAndVote) => {
      console.log("Found Entry is: " + foundEntryAndVote[0]);
      if (foundEntryAndVote[0]) {
        var changeVoteButtons = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(
                `resetVote-yes-${splitButtonName[0]}-${splitButtonName[1]}`
              )
              .setLabel("Yes")
              .setStyle("4")
          )
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`resetVote-no-${splitButtonName[0]}`)
              .setLabel("No")
              .setStyle("1")
          );

        var removeVoteButtons = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(
                `resetVote-remove-${splitButtonName[0]}-${splitButtonName[1]}`
              )
              .setLabel("Yes")
              .setStyle("4")
          )
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`resetVote-no-${splitButtonName[0]}`)
              .setLabel("No")
              .setStyle("1")
          );
        //await interaction.deleteReply();

        if (foundEntryAndVote[1] == splitButtonName[0]) {
          await interaction
            .reply({
              content:
                "It would appear you have already voted for `" +
                foundEntryAndVote[1] +
                "` today.\nWould you like to remove your vote?",
              components: [removeVoteButtons],
              ephemeral: true,
            })
            .then(() => console.log("Reply sent."))
            .catch((_) => null);
          return 0;
        }

        await interaction
          .reply({
            content:
              "It would appear you have already voted for `" +
              foundEntryAndVote[1] +
              "` today.\nWould you like to change your vote to `" +
              splitButtonName[0] +
              "`?`",
            components: [changeVoteButtons],
            ephemeral: true,
          })
          .then(() => console.log("Reply sent."))
          .catch((_) => null);
        return 0;
      }

      if (splitButtonName[0] == "resetVote") {
        if (splitButtonName[1] == "yes") {
          //console.log(interaction);

          await interaction
            .update({
              content:
                "Thank you for voting!\nYour vote has been changed to ``" +
                splitButtonName[2] +
                "``.",
              components: [],
              ephemeral: true,
            })
            .catch(console.error);
          
          
          console.log("Round: " + splitButtonName[3]);
          RemovePreviousVotes(
            populatedDb,
            interaction.member.id,
            splitButtonName[3]
          );
          removeVoteByMemberId(populatedDb, interaction.member.id)
          console.log("Is it this we're hitting?");
          await UpdateTotals(
            interaction,
            populatedDb,
            splitButtonName,
            false
          ).catch(console.error);
          
          UpdateTable(db, populatedDb);
          return 0;
        } else if (splitButtonName[1] == "remove") {
          await interaction
            .update({
              content: "Your vote has been reset.",
              components: [],
              ephemeral: true,
            })
            .catch(console.error);

          console.log("Round: " + splitButtonName[3]);
          RemovePreviousVotes(
            populatedDb,
            interaction.member.id,
            splitButtonName[3],
            true
          );

          //RemoveVoteFromToday(populatedDb, roundNumber, interaction.member.id)
          removeVoteByMemberId(populatedDb, interaction.member.id);

          UpdateTable(db, populatedDb);
        } else if (splitButtonName[1] == "no") {
          await interaction.update({
            content: "Your vote has not been changed.",
            components: [],
            ephemeral: true,
          });
          return 0;
        }
        return 0;
      }

      if (!foundEntry) {
        console.log("This should only happen on first entry");
        await UpdateTotals(
          interaction,
          populatedDb,
          splitButtonName,
          true
        ).catch(console.error);
      }

      UpdateTable(db, populatedDb);
    }
  );
}

async function IsSecondVote(interaction, populatedDb, splitButtonName) {
  var promise = new Promise((resolve) => {
    populatedDb.map(async (item) => {
      if (item.round == splitButtonName[1]) {
        for (var i = 0; i < item.votedToday.length; i++) {
          console.log(item.votedToday[i].memberId);
          if (item.votedToday[i].memberId == interaction.member.id) {
            console.log("We found the user");
            resolve([true, item.votedToday[i].vote]);
            return promise;

            //.catch(async (error) => {
            //  console.error(error);
            //  await interaction
            //    .editReply({
            //      content: "It would appear you have already voted.",
            //      ephemeral: true,
            //    })
            //    .catch(async (error) => {
            //      console.error(error);
            //    });
            //});
          }
        }
      }
    });
    resolve(false);
  });
  return promise;
}

async function UpdateTotals(
  interaction,
  populatedDb,
  splitButtonName,
  firstPass
) {
  var roundNumber = firstPass ? splitButtonName[1] : splitButtonName[3];
  var vote = firstPass ? splitButtonName[0] : splitButtonName[2];

  await populatedDb.map((item) => {
    if (item.round == splitButtonName[1]) {
      for (var i = 0; i < item.votedToday.length; i++) {
        console.log(item.votedToday[i].memberId);
        console.log(interaction.member.id);
        if (item.votedToday[i].memberId == interaction.member.id && firstPass) {
          console.log("We're done here, don't update");
          return 0;
        }
      }
    }
  });
  console.log("Shit, we're going for it.");
  switch (vote) {
    case "A>B>C":
      UpdateVotesToday(populatedDb, roundNumber, interaction.member.id, vote);
      populatedDb.map((item) => {
        if (item.round == roundNumber) {
          for (var i = 0; i < item.entries.length; i++) {
            if (item.entries[i].hasTakenPlace == false) {
              // We get the next upcoming battle for ease, but actually want the one beforehand.
              item.entries[i].points = parseInt(item.entries[i].points) + 2;
              item.entries[i].usersFirstPick.push(interaction.member.id);
              item.entries[i + 1].points =
                parseInt(item.entries[i + 1].points) + 1;
              item.entries[i + 1].usersSecondPick.push(interaction.member.id);
              item.entries[i + 2].usersDidNotPlace.push(interaction.member.id);
              break;
            }
          }
        }
      });
      if (firstPass) {
        await interaction.reply({
          content: "Thank you for voting!\nYou voted A>B>C.",
          ephemeral: true,
        });
      }
      break;
    case "A>C>B":
      UpdateVotesToday(populatedDb, roundNumber, interaction.member.id, vote);
      populatedDb.map((item) => {
        if (item.round == roundNumber) {
          for (var i = 0; i < item.entries.length; i++) {
            if (item.entries[i].hasTakenPlace == false) {
              // We get the next upcoming battle for ease, but actually want the one beforehand.
              item.entries[i].points = parseInt(item.entries[i].points) + 2;
              item.entries[i].usersFirstPick.push(interaction.member.id);
              item.entries[i + 1].usersDidNotPlace.push(interaction.member.id);
              item.entries[i + 2].points =
                parseInt(item.entries[i + 2].points) + 1;
              item.entries[i + 2].usersSecondPick.push(interaction.member.id);
              break;
            }
          }
        }
      });
      if (firstPass) {
        await interaction.reply({
          content: "Thank you for voting!\nYou voted A>C>B.",
          ephemeral: true,
        });
      }
      break;
    case "B>A>C":
      UpdateVotesToday(populatedDb, roundNumber, interaction.member.id, vote);
      populatedDb.map((item) => {
        if (item.round == roundNumber) {
          for (var i = 0; i < item.entries.length; i++) {
            if (item.entries[i].hasTakenPlace == false) {
              // We get the next upcoming battle for ease, but actually want the one beforehand.
              item.entries[i].points = parseInt(item.entries[i].points) + 1;
              item.entries[i].usersSecondPick.push(interaction.member.id);
              item.entries[i + 1].points =
                parseInt(item.entries[i + 1].points) + 2;
              item.entries[i + 1].usersFirstPick.push(interaction.member.id);
              item.entries[i + 2].usersDidNotPlace.push(interaction.member.id);
              break;
            }
          }
        }
      });
      if (firstPass) {
        await interaction.reply({
          content: "Thank you for voting!\nYou voted B>A>C.",
          ephemeral: true,
        });
      }
      break;
    case "B>C>A":
      UpdateVotesToday(populatedDb, roundNumber, interaction.member.id, vote);
      populatedDb.map((item) => {
        if (item.round == roundNumber) {
          for (var i = 0; i < item.entries.length; i++) {
            if (item.entries[i].hasTakenPlace == false) {
              // We get the next upcoming battle for ease, but actually want the one beforehand.
              item.entries[i].usersDidNotPlace.push(interaction.member.id);
              item.entries[i + 1].points =
                parseInt(item.entries[i + 1].points) + 2;
              item.entries[i + 1].usersFirstPick.push(interaction.member.id);
              item.entries[i + 2].points =
                parseInt(item.entries[i + 2].points) + 1;
              item.entries[i + 2].usersSecondPick.push(interaction.member.id);
              break;
            }
          }
        }
      });
      if (firstPass) {
        await interaction.reply({
          content: "Thank you for voting!\nYou voted B>C>A.",
          ephemeral: true,
        });
      }
      break;
    case "C>A>B":
      UpdateVotesToday(populatedDb, roundNumber, interaction.member.id, vote);
      populatedDb.map((item) => {
        if (item.round == roundNumber) {
          for (var i = 0; i < item.entries.length; i++) {
            if (item.entries[i].hasTakenPlace == false) {
              // We get the next upcoming battle for ease, but actually want the one beforehand.
              item.entries[i].points = parseInt(item.entries[i].points) + 1;
              item.entries[i].usersSecondPick.push(interaction.member.id);
              item.entries[i + 1].usersDidNotPlace.push(interaction.member.id);
              item.entries[i + 2].points =
                parseInt(item.entries[i + 2].points) + 2;
              item.entries[i + 2].usersFirstPick.push(interaction.member.id);
              break;
            }
          }
        }
      });
      if (firstPass) {
        await interaction.reply({
          content: "Thank you for voting!\nYou voted C>A>B.",
          ephemeral: true,
        });
      }
      break;
    case "C>B>A":
      UpdateVotesToday(populatedDb, roundNumber, interaction.member.id, vote);
      populatedDb.map((item) => {
        if (item.round == roundNumber) {
          for (var i = 0; i < item.entries.length; i++) {
            if (item.entries[i].hasTakenPlace == false) {
              // We get the next upcoming battle for ease, but actually want the one beforehand.
              item.entries[i].usersDidNotPlace.push(interaction.member.id);
              item.entries[i + 1].points =
                parseInt(item.entries[i + 1].points) + 1;
              item.entries[i + 1].usersSecondPick.push(interaction.member.id);
              item.entries[i + 2].points =
                parseInt(item.entries[i + 2].points) + 2;
              item.entries[i + 2].usersFirstPick.push(interaction.member.id);
              break;
            }
          }
        }
      });
      if (firstPass) {
        await interaction.reply({
          content: "Thank you for voting!\nYou voted C>B>A.",
          ephemeral: true,
        });
      }
      break;
  }
}

function UpdateVotesToday(populatedDb, roundNumber, userId, userVote) {
  populatedDb.map((item) => {
    if (item.round == roundNumber) {
      const userFoundIndex = item.votedToday.findIndex(
        (el) => el.memberId == userId
      );

      if (userFoundIndex >= 0) {
        item.votedToday[userFoundIndex].vote = userVote;
      } else {
        item.votedToday.push({
          memberId: userId,
          vote: userVote,
        });
      }
    }
  });
}

function RemoveVoteFromToday(populatedDb, roundNumber, userId) {
  populatedDb.map((item) => {
    if (item.round == roundNumber) {
      const userFoundIndex = item.votedToday.findIndex(
        (el) => el.memberId == userId
      );

      if (userFoundIndex >= 0) {
        item.votedToday.splice(userFoundIndex, 1);
      }
    }
  });
}

function RemovePreviousVotes(
  populatedDb,
  userId,
  roundNumber,
  isReset = false
) {
  populatedDb.map((item) => {
    if (item.round == roundNumber) {
      for (var i = 0; i < item.entries.length; i++) {
        if (item.entries[i].hasTakenPlace == false) {
          // We get the next upcoming battle for ease, but actually want the one beforehand.
          ////////////////////////////////////////////////////////////
          var userFoundIndex = item.entries[i].usersFirstPick.findIndex(
            (el) => el == userId
          );
          if (userFoundIndex >= 0) {
            item.entries[i].points = parseInt(item.entries[i].points) - 2;
            item.entries[i].usersFirstPick.splice(userFoundIndex, 1);
          }

          userFoundIndex = item.entries[i].usersSecondPick.findIndex(
            (el) => el == userId
          );
          if (userFoundIndex >= 0) {
            item.entries[i].points = parseInt(item.entries[i].points) - 1;
            item.entries[i].usersSecondPick.splice(userFoundIndex, 1);
          }

          userFoundIndex = item.entries[i].usersDidNotPlace.findIndex(
            (el) => el == userId
          );
          if (userFoundIndex >= 0) {
            item.entries[i].usersDidNotPlace.splice(userFoundIndex, 1);
          }
          //////////////////////////////////////////////////////////////
          var userFoundIndex = item.entries[i + 1].usersFirstPick.findIndex(
            (el) => el == userId
          );
          if (userFoundIndex >= 0) {
            item.entries[i + 1].points =
              parseInt(item.entries[i + 1].points) - 2;
            item.entries[i + 1].usersFirstPick.splice(userFoundIndex, 1);
          }

          userFoundIndex = item.entries[i + 1].usersSecondPick.findIndex(
            (el) => el == userId
          );
          if (userFoundIndex >= 0) {
            item.entries[i + 1].points =
              parseInt(item.entries[i + 1].points) - 1;
            item.entries[i + 1].usersSecondPick.splice(userFoundIndex, 1);
          }

          userFoundIndex = item.entries[i + 1].usersDidNotPlace.findIndex(
            (el) => el == userId
          );
          if (userFoundIndex >= 0) {
            item.entries[i + 1].usersDidNotPlace.splice(userFoundIndex, 1);
          }
          ///////////////////////////////////////////////////////////////
          var userFoundIndex = item.entries[i + 2].usersFirstPick.findIndex(
            (el) => el == userId
          );
          if (userFoundIndex >= 0) {
            item.entries[i + 2].points =
              parseInt(item.entries[i + 2].points) - 2;
            item.entries[i + 2].usersFirstPick.splice(userFoundIndex, 1);
          }

          userFoundIndex = item.entries[i + 2].usersSecondPick.findIndex(
            (el) => el == userId
          );
          if (userFoundIndex >= 0) {
            item.entries[i + 2].points =
              parseInt(item.entries[i + 2].points) - 1;
            item.entries[i + 2].usersSecondPick.splice(userFoundIndex, 1);
          }

          userFoundIndex = item.entries[i + 2].usersDidNotPlace.findIndex(
            (el) => el == userId
          );
          if (userFoundIndex >= 0) {
            item.entries[i + 2].usersDidNotPlace.splice(userFoundIndex, 1);
          }

          break;
        }
      }
    }
  });
}

function removeVoteByMemberId(awards, memberId) {
  for (const award of awards) {
    if (award.isCurrentRound) {
      award.votedToday = award.votedToday.filter(
        (vote) => vote.memberId !== memberId
      );
      break;
    }
  }
}
// var entriesForRound = GetCurrentBattle(populatedDb, round);
//  console.log("Setting round to ran" + entriesForRound[0]);
//  entriesForRound.forEach((entry) => {
//    entry.hasTakenPlace = true;
//
//    populatedDb.map((item) => {
//      if (item.round == round) {
//        item.entries.map((dbEntry) => {
//          if (dbEntry.name == entry.name) {
//            dbEntry = entry;
//          }
//        });
//      }
//    });
//  });
//  console.log(
//    "--------------\n" +
//      JSON.stringify(populatedDb.find((item) => item.round == round).entries) +
//      "\n--------------"
//  );
//}
