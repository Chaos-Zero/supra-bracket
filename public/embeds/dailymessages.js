const { Client, ButtonBuilder, EmbedBuilder } = require("discord.js");
const { ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const fs = require("fs");
eval(fs.readFileSync("./public/utils/messageutils.js") + "");
eval(fs.readFileSync("./public/main.js") + "");

async function SendDailyEmbed(
  interaction,
  tournamentTableName,
  tournamentRoundDetails,
  reactionDetails
) {
  const d = new Date();
  //let imagename = d.toISOString().slice(0, 10);
  let imagename = "test2";
  
  var previousDaysPoints = await CalculateReactionPoints(reactionDetails);
  
  console.log("Checking points after timeout " + previousDaysPoints);

  const getMax = (object) => {
    let max = Math.max(...Object.values(object));
    return Object.keys(object).filter((key) => object[key] == max);
  };

  var previousWinner = getMax(previousDaysPoints);
  console.log("Previous winner number " + previousWinner);
  console.log(
    "Our Previous Winner: " +
      tournamentRoundDetails[1][parseInt(previousWinner)].name
  );

  const gifPath =
    "https://sd-bracket-bot.glitch.me/commands/gif/output/" +
    imagename +
    ".gif";
  //console.log(gifPath);
  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("previous-results")
      .setPlaceholder(
        "Previous Winner: " +
          tournamentRoundDetails[1][parseInt(previousWinner)].name
      )
      .addOptions([
        {
          label: tournamentRoundDetails[1][0].name,
          description: tournamentRoundDetails[1][0].points + ` points`,
          value: "1",
          default: false,
        },
        {
          label: tournamentRoundDetails[1][1].name,
          description: tournamentRoundDetails[1][1].points + ` points`,
          value: "2",
          default: false,
        },
        {
          label: tournamentRoundDetails[1][2].name,
          description: tournamentRoundDetails[1][2].points + ` points`,
          value: "3",
          default: false,
        },
      ])
  );

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
        name: "**TODAY'S BATTLE:** Voting for this round ends <t:1677102826:R>",
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
  //.setImage(gifPath);
  //const channel2 = GetChannelByName(
  //      interaction.member.guild,
  //    "best-vgm-2022-awards"
  //);

  const channel = await GetChannelByName(
    interaction.member.guild,
    "best-vgm-2022-awards"
  );
  await setTimeout(100);
  channel.send({
    content: "Hello all and <@&1077345571221807244>",
    components: [row],
  });
  channel.send({ embeds: [embed] }).then((embedMessage) => {
    embedMessage.react("1️⃣");
    embedMessage.react("2️⃣");
    embedMessage.react("3️⃣");
    embedMessage.react("4️⃣");
    embedMessage.react("5️⃣");
    embedMessage.react("6️⃣");
  });
    
   //dbUpdates = {isCompleted: true, points: 0, users1: [], users2: [], users3: []  } .
      
   // for (var i = 0; i < previousDaysPoints.length; i++){
    //  updateParams = { isCompleted: true, points: previousDaysPoints[i]}
    //  UpdateBattleResults(GetDb, table, tournamentRoundDetails[2], tournamentRoundDetails[1][i].name, updateParams)
     //   }
}

//var buttonEmbed = new EmbedBuilder()
//.setTimestamp(Date.now() + 1)
//.setTitle("Round 1 - Battle 4")
//.setAuthor({
//  name: "Best VGM 2022",
//  iconURL:
//    "https://cdn.glitch.global/485febab-53bf-46f2-9ec1-a3c597dfaebe/Kurby%20FINAL.png?v=1676930836792",
//})
//.setColor("0xffff00")
//.setDescription(
//  "Hello all and <@&${1077345905742708856}>,\n\n\n**TODAY'S BATTLE:** Vote for your ranked order of preference by reacting to this post\n"
//)
//.addFields(
//  {
//    name: `A. Sephonie - Poured sunrise, hearts revealed`,
//    value: `https://youtu.be/F1kkeoSRy0s`,
//  },
//  {
//    name: `B. Xenoblade Chronicles 3 - Where We Belong`,
//    value: `https://youtu.be/3OSlUabG_e0`,
//  },
//  {
//    name: `C. Harvestella - Our Souls Touch`,
//    value: `https://youtu.be/OTa4ixCbm_k`,
//  }
//)
////  .setTitle(`${title1}`)
////.setDescription("Blah blah")
//.setThumbnail(
//  "https://cdn.glitch.global/485febab-53bf-46f2-9ec1-a3c597dfaebe/SD%20Logo.png?v=1676855711752"
//)
////.setImage(gifPath)
//.setFooter({
//  text: "Time left to vote: ",
//  //GetBallImage(pokemonEntry.EvoBall).img
//  iconURL:
//    "https://cdn.glitch.global/485febab-53bf-46f2-9ec1-a3c597dfaebe/sd-img.jpeg?v=1676586931016",
//});

//var aButtonVotes = new ActionRowBuilder()
//  .addComponents(
//    new ButtonBuilder().setCustomId("a1").setLabel("A>B>C").setStyle("4")
//  )
//  .addComponents(
//    new ButtonBuilder().setCustomId("a2").setLabel("A>C>B").setStyle("4")
//  );
//
//var bButtonVotes = new ActionRowBuilder()
//  .addComponents(
//    new ButtonBuilder().setCustomId("b1").setLabel("B>A>C").setStyle("1")
//  )
//  .addComponents(
//    new ButtonBuilder().setCustomId("b2").setLabel("B>A>C").setStyle("1")
//  );
//var cButtonVotes = new ActionRowBuilder()
//  .addComponents(
//    new ButtonBuilder().setCustomId("c1").setLabel("C>A>B").setStyle("3")
//  )
//  .addComponents(
//    new ButtonBuilder().setCustomId("c2").setLabel("C>A>B").setStyle("3")
//  );
//
//var line1 = new ActionRowBuilder()
//  .addComponents(
//    new ButtonBuilder().setCustomId("a1").setLabel("A>B>C").setStyle("4")
//  )
//  .addComponents(
//    new ButtonBuilder().setCustomId("a2").setLabel("A>C>B").setStyle("4")
//  )
//  .addComponents(
//    new ButtonBuilder().setCustomId("b1").setLabel("B>A>C").setStyle("1")
//  )
//  .addComponents(
//    new ButtonBuilder().setCustomId("b2").setLabel("B>A>C").setStyle("1")
//  )
//  .addComponents(
//    new ButtonBuilder().setCustomId("c1").setLabel("C>A>B").setStyle("3")
//  );
//var line2 = new ActionRowBuilder().addComponents(
//  new ButtonBuilder().setCustomId("c2").setLabel("C>A>B").setStyle("3")
//);
