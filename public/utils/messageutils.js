// Required Declarations
const { Client, RichEmbed } = require("discord.js");
const sleep = require("util").promisify(setTimeout);
const Discord = require("discord.js");

//var FileSync = require("lowdb/adapters/FileSync");
//var adapter = new FileSync(".data/db.json");
//var low = require("lowdb");
//var db = low(adapter);

class RoundVoteResults {
  constructor(name = "", count = "") {
    this.emojiName = name;
    this.emojiCount = count;
    this.users = [];
  }
}

function returnDuplicateEntries(entries) {
  var duplicates = entries.reduce(function (acc, el, i, arr) {
    if (arr.indexOf(el) !== i && acc.indexOf(el) < 0) acc.push(el);
    return acc;
  }, []);

  return duplicates;
}

async function CheckForReactionDuplicates(message) {
  let reactions = await message.reactions.cache;
  var userIds = [];
  reactions = reactions.toJSON();
  console.log("Let's see them reactions: " + reactions);
  console.log("Let's see them reactions: " + reactions.length);
  for (var i = 0; i < reactions.length; i++) {
    const reactionUsers = await reactions[i].users.fetch();
    const reactionUsersArray = Array.from(reactionUsers.keys());
    console.log("reactionUsersArray" + reactionUsersArray);
    userIds.push.apply(userIds, reactionUsersArray);
  }

  return returnDuplicateEntries(userIds);
}

async function SendMessageForDuplicateVotes() {
  var guild = await GetBot().guilds.cache.get(process.env.GUILD_ID);
  await sleep(2000);
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

async function GetChannelByName(guild, channelString) {
  var channel = await guild.channels.cache.find(
    (ch) => ch.name === channelString
  );
  //console.log("Channel: " + channel.name);

  return await channel;
}

async function GetLastMessageInChannel(channel) {
  let lastMessages = await channel.messages.fetch({ limit: 2 });
  // this is the last message sent before this command
  //console.log("Last Message: " + lastMessages.first().content);
  return await lastMessages.first();
}

async function CheckReactions(reaction, user) {
  console.log("Let's go");
  // edit: so that this does not run when the bot reacts

  await HasUserReacted(reaction.message, user.id).then(async (hasReacted) => {
    console.log(hasReacted);
    if (hasReacted > 1) {
      reaction.users.remove(user.id);
    }
  });
}

async function RemoveBotReactions(message) {
  console.log(message);
  // edit: so that this does not run when the bot reacts
  message.reactions.forEach((reaction) => reaction.remove(process.env.BOT_ID));
}

async function HasUserReacted(message, userId) {
  var hasReactedCount = 0;
  let reactions = await message.reactions.cache;
  reactions = reactions.toJSON();
  console.log("Let's see them reactions: " + reactions);
  console.log("Let's see them reactions: " + reactions.length);
  for (var i = 0; i < reactions.length; i++) {
    const reactionUsers = await reactions[i].users.fetch();
    const reactionUsersArray = Array.from(reactionUsers.keys());

    for (var j = 0; j < reactionUsersArray.length; j++) {
      console.log("This should be my Id: " + userId);
      console.log(
        "This should be the Id being matched: " + reactionUsersArray[j]
      );
      if (
        userId.toString().valueOf() ==
        reactionUsersArray[j].toString().valueOf()
      ) {
        hasReactedCount += 1;
      }
    }
  }
  return hasReactedCount;
}

async function GetMessageReactions(message, roundVoteResultsCollection) {
  //let info =
  let reactions = await message.reactions.cache;
  reactions = reactions.toJSON();
  //console.log("Let's see them reactions: " + reactions);
  for (var i = 0; i < reactions.length; i++) {
    let roundVoteResults = new RoundVoteResults();
    const reactionUsers = await reactions[i].users.fetch();
    const reactionUsersArray = Array.from(reactionUsers.keys());

    roundVoteResults.emojiName = reactions[i].emoji.name;
    //console.log("We got this name" + reactions[i].emoji.name);
    roundVoteResults.emojiCount = reactions[i].count;
    //console.log("We got this many reactions: " + reactions[i].count);
    //console.log("The group of users: " + reactionUsersArray);

    for (var j = 0; j < reactionUsersArray.length; j++) {
      //console.log("The name: " + reactionUsersArray[j]);
      if (reactionUsersArray[j] !== process.env.BOT_ID) {
        roundVoteResults.users.push(reactionUsersArray[j]);
      }
      //console.log("What" + roundVoteResults);
    }
    //console.log("We got these results: " + roundVoteResults.users[0]);
    roundVoteResultsCollection.push(roundVoteResults);
  }
  console.log("Our colection: " + roundVoteResultsCollection[0].users[0]);
}

function GetLastMessageDetailsFromChannelName(
  channelString,
  guild,
  roundVoteResultsCollection
) {
  return new Promise((resolve) => {
    GetChannelByName(guild, channelString).then((channel) => {
      GetLastMessageInChannel(channel).then(async (lastMessage) => {
        GetMessageReactions(lastMessage, roundVoteResultsCollection);
      });
    });
    resolve();
  });
}

async function CalculateReactionPoints(reactionDetails) {
  //[{emojiName, emojiCount, users: []}]
  // 1 = A + 2, B + 1
  // 2 = A + 2 ,C + 1
  // 3 = B + 2, A + 1
  // 4 = B + 2, C + 1
  // 5 = C + 2, A + 1
  // 6 = C + 2, B + 1
  var localReactionDetails = reactionDetails;
  var entry1Tally = 0,
    entry2Tally = 0,
    entry3Tally = 0;
  var votedAFirst = [];
  var votedASecond = [];
  var didNotVoteA = [];
  var votedBFirst = [];
  var votedBSecond = [];
  var didNotVoteB = [];
  var votedCFirst = [];
  var votedCSecond = [];
  var didNotVoteC = [];

  console.log("Reactions object: " + localReactionDetails[0].users);
  // All voters
  var listOfVoters = [];

  for (var i = 0; i < localReactionDetails.length; i++) {
    listOfVoters.push.apply(listOfVoters, localReactionDetails[i].users);
  }
  // All Duplicate voter ids
  var duplicateUsers = returnDuplicateEntries(listOfVoters);

  var filteredDetails = [];
  var filteredReactionDetails = [];

  for (var i = 0; i < localReactionDetails.length; i++) {
    //var count = parseInt(localReactionDetails[i].users.length);
    for (const user of duplicateUsers) {
      localReactionDetails[i].users = localReactionDetails[i].users.filter(
        (item) => item !== user
      );
    }
    localReactionDetails[i].emojiCount = localReactionDetails[i].users.length;
  }

  //console.log("Length: " + reactionDetails);
  for (var i = 0; i < localReactionDetails.length; i++) {
    console.log(localReactionDetails[i].users);
    switch (localReactionDetails[i].emojiName) {
      case "1️⃣":
        entry1Tally += parseInt(localReactionDetails[i].emojiCount) * 2;
        entry2Tally += parseInt(localReactionDetails[i].emojiCount);

        votedAFirst.push.apply(votedAFirst, localReactionDetails[i].users);
        votedBSecond.push.apply(votedBSecond, localReactionDetails[i].users);
        didNotVoteC.push.apply(didNotVoteC, localReactionDetails[i].users);
        break;
      case "2️⃣":
        entry1Tally += parseInt(localReactionDetails[i].emojiCount) * 2;
        entry3Tally += parseInt(localReactionDetails[i].emojiCount);

        votedAFirst.push.apply(votedAFirst, localReactionDetails[i].users);
        votedCSecond.push.apply(votedCSecond, localReactionDetails[i].users);
        didNotVoteB.push.apply(didNotVoteB, localReactionDetails[i].users);
        break;
      case "3️⃣":
        entry2Tally += parseInt(localReactionDetails[i].emojiCount) * 2;
        entry1Tally += parseInt(localReactionDetails[i].emojiCount);

        votedBFirst.push.apply(votedBFirst, localReactionDetails[i].users);
        votedASecond.push.apply(votedASecond, localReactionDetails[i].users);
        didNotVoteC.push.apply(didNotVoteC, localReactionDetails[i].users);
        break;
      case "4️⃣":
        entry2Tally += parseInt(localReactionDetails[i].emojiCount) * 2;
        entry3Tally += parseInt(localReactionDetails[i].emojiCount);

        votedBFirst.push.apply(votedBFirst, localReactionDetails[i].users);
        votedCSecond.push.apply(votedCSecond, localReactionDetails[i].users);
        didNotVoteA.push.apply(didNotVoteA, localReactionDetails[i].users);
        break;
      case "5️⃣":
        entry3Tally += parseInt(localReactionDetails[i].emojiCount) * 2;
        entry1Tally += parseInt(localReactionDetails[i].emojiCount);

        votedCFirst.push.apply(votedCFirst, localReactionDetails[i].users);
        votedASecond.push.apply(votedASecond, localReactionDetails[i].users);
        didNotVoteB.push.apply(didNotVoteB, localReactionDetails[i].users);
        break;
      case "6️⃣":
        entry3Tally += parseInt(localReactionDetails[i].emojiCount) * 2;
        entry2Tally += parseInt(localReactionDetails[i].emojiCount);

        votedCFirst.push.apply(votedCFirst, localReactionDetails[i].users);
        votedBSecond.push.apply(votedBSecond, localReactionDetails[i].users);
        didNotVoteA.push.apply(didNotVoteA, localReactionDetails[i].users);
        break;
    }
  }
  console.log("Who voted for c first: " + votedCFirst);
  var votesForA = {
    first: votedAFirst,
    second: votedASecond,
    last: didNotVoteA,
  };
  var votesForB = {
    first: votedBFirst,
    second: votedBSecond,
    last: didNotVoteB,
  };
  var votesForC = {
    first: votedCFirst,
    second: votedCSecond,
    last: didNotVoteC,
  };
  var votesPerGame = [votesForA, votesForB, votesForC];

  console.log("Tallys: " + entry1Tally + " " + entry2Tally + " " + entry3Tally);
  return [{ 0: entry1Tally, 1: entry2Tally, 2: entry3Tally }, votesPerGame];
}

//async function GetReactionResults(message) {
//  const reactions = await message.reactions.cache;
//  await PopulateReactionResults(reactions).then(
//    (resultsCollection) => {
//      return resultsCollection;
//    }
//  );
//}
//
//async function PopulateReactionResults(reactions) {
//  let resultsCollection = [];
//  let roundVoteResults = new RoundVoteResults();
//  for (const reaction in reactions) {
//    roundVoteResults.emojiName = reaction.emoji.name;
//    roundVoteResults.emojiCount = reaction.count;
//    await reaction.users.fetch().then((reactionUsers) => {
//      //console.log(emojiName + " has " + emojiCount);
//      for (const user in reactionUsers) {
//        roundVoteResults.users.push(user.username);
//      }
//      resultsCollection.push(roundVoteResults);
//      console.log("From collection: " + roundVoteResults);
//    });
//  }
//  return resultsCollection
//}
//
//async function SendResult(resultsCollection, interaction) {
//  console.log("From collection: " + resultsCollection[0].users);
//  interaction.reply(
//    "From collection: " + resultsCollection[0].users[0]
//    //roundVoteResultsCollection[0].emojiName +
//    //roundVoteResultsCollection[0].emojiCount
//  );
//}
//
//async function GetMessageReactions(message, interaction) {
//  const results = await GetReactionResults(message);
//  SendResult(results, interaction);
//}
//
//async function GetLastMessageDetailsFromChannelName(
//  channelString,
//  interaction
//) {
//  GetChannelByName(interaction.member.guild, channelString).then((channel) => {
//    GetLastMessageInChannel(channel).then(async (lastMessage) => {
//      return await GetMessageReactions(lastMessage, interaction);
//    });
//  });
//}
