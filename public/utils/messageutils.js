// Required Declarations
const { Client, RichEmbed } = require("discord.js");
const Discord = require("discord.js");

class RoundVoteResults {
  constructor(name = "", count = "") {
    this.emojiName = name;
    this.emojiCount = count;
    this.users = [];
  }
}

async function GetChannelByName(guild, channelString) {
  var channel = guild.channels.cache.find((ch) => ch.name === channelString);
  //console.log("Channel: " + channel.name);

  return await channel;
}

async function GetLastMessageInChannel(channel) {
  let lastMessages = await channel.messages.fetch({ limit: 2 });
  // this is the last message sent before this command
  //console.log("Last Message: " + lastMessages.first().content);
  return await lastMessages.first();
}

async function GetMessageReactions(
  message,
  interaction,
  roundVoteResultsCollection
) {
  //let info =
  let reactions = await message.reactions.cache;
  reactions = reactions.toJSON();
  //console.log("Let's see them reactions: " + reactions);
  for (var i = 0 ; i < reactions.length; i++) {
    let roundVoteResults = new RoundVoteResults();
    const reactionUsers = await reactions[i].users.fetch();

    roundVoteResults.emojiName = reactions[i].emoji.name;
    console.log("We got this name" + reactions[i].emoji.name);
    roundVoteResults.emojiCount = reactions[i].count;
    console.log("We got this many reactions: " + reactions[i].count);
    for (var j = 0; j < reactionUsers; j++) {
      //console.log("The name: " + reactionUsers[i].username);
      roundVoteResults.users.push(reactionUsers[i].username);
      //console.log("What" + roundVoteResults);
    }
    console.log("We got these results: " + roundVoteResults);
    roundVoteResultsCollection.push(roundVoteResults);
  }
}

function GetLastMessageDetailsFromChannelName(
  channelString,
  interaction,
  roundVoteResultsCollection
) {
  return new Promise((resolve) => {
    resolve(
      GetChannelByName(interaction.member.guild, channelString).then(
        (channel) => {
          GetLastMessageInChannel(channel).then(async (lastMessage) => {
            GetMessageReactions(
              lastMessage,
              interaction,
              roundVoteResultsCollection
            );
          });
        }
      )
    );
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
  var entry1Tally = 0,
    entry2Tally = 0,
    entry3Tally = 0;
  var votedAFirst, votedASecond, didNotVoteA, votedBFirst, votedBSecond, didNotVoteB, votedCFirst, votedCSecond, didNotVoteC = []
  
  //console.log("Length: " + reactionDetails);
  for (var i = 0; i < reactionDetails.length; i++) {
    switch (reactionDetails[i].emojiName) {
      case "1️⃣":
        entry1Tally += ((parseInt(reactionDetails[i].emojiCount) - 1) * 2);
        entry2Tally += parseInt(reactionDetails[i].emojiCount) - 1;
        votedAFirst.push(reactionDetails[i].users);
        votedBSecond.push(reactionDetails[i].users);
        didNotVoteC.push(reactionDetails[i].users);
        break;
      case "2️⃣":
        entry1Tally += ((parseInt(reactionDetails[i].emojiCount) - 1) * 2);
        entry3Tally += parseInt(reactionDetails[i].emojiCount) - 1;
        votedAFirst.push(reactionDetails[i].users);
        votedCSecond.push(reactionDetails[i].users);
        didNotVoteB.push(reactionDetails[i].users);
        break;
      case "3️⃣":
        entry2Tally += ((parseInt(reactionDetails[i].emojiCount) - 1) * 2);
        entry1Tally += parseInt(reactionDetails[i].emojiCount) - 1;
        votedBFirst.push(reactionDetails[i].users);
        votedASecond.push(reactionDetails[i].users);
        didNotVoteC.push(reactionDetails[i].users);
        break;
      case "4️⃣":
        entry2Tally += ((parseInt(reactionDetails[i].emojiCount) - 1) * 2);
        entry3Tally += parseInt(reactionDetails[i].emojiCount) - 1;
        votedBFirst.push(reactionDetails[i].users);
        votedCSecond.push(reactionDetails[i].users);
        didNotVoteA.push(reactionDetails[i].users);
        break;
      case "5️⃣":
        entry3Tally += ((parseInt(reactionDetails[i].emojiCount) - 1) * 2);
        entry1Tally += parseInt(reactionDetails[i].emojiCount) - 1;
        votedCFirst.push(reactionDetails[i].users);
        votedASecond.push(reactionDetails[i].users);
        didNotVoteB.push(reactionDetails[i].users);
        break;
      case "6️⃣":
        entry3Tally += ((parseInt(reactionDetails[i].emojiCount) - 1) * 2);
        entry2Tally += parseInt(reactionDetails[i].emojiCount) - 1;
        votedCFirst.push(reactionDetails[i].users);
        votedBSecond.push(reactionDetails[i].users);
        didNotVoteA.push(reactionDetails[i].users);
        break;
    }
  }
  var votesForA = {first: votedAFirst, second: votedASecond, last: didNotVoteA};
  var votesForB = {first: votedBFirst, second: votedBSecond, last: didNotVoteB};
  var votesForC = {first: votedCFirst, second: votedCSecond, last: didNotVoteC};
  var votesPerGame ={ 0:votesForA, 1:votesForB, 2:votesForC }  
  
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
