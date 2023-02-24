function GetDbUsers(db, tableName) {
  var dbUsers = [];
  var users = db.get(tableName).value();
  users.forEach(function(user) {
    dbUsers.push([user.username]); // adds their info to the dbUsers value
  });
  return dbUsers;
}

function GetDbTable(db, table) {
  return db.get(table).value();
}

async function GetNextTournamentRound(db, tournamentName, numberOfTracks) {
  var currentTournament = db.get(tournamentName).value();
  //console.log(currentTournament);

  var currentRound;
  currentTournament.every(function (round) {
    if (round.completed == false) {
      currentRound = round.round;
      //console.log(currentRound);
      return false;
    }
    return true;
  });
  
  var entries = db
    .get(tournamentName)
    .find({ round: currentRound })
    .get("entries")
    .value();


  //console.log(entries);

  var allEntries = [];
  var lastContestants = [];
  var todaysContestants = [];
  //console.log(entries.length);

  entries.every(function (entry) {
    if (entries.hasTakenPlace == false) {
      currentRound = entries.round;
      //console.log(currentRound);
      return false;
    }
    return true;
  });

  entries.forEach(function (entry) {
    allEntries.push({
      name: entry.name,
      link: entry.link,
      battle: entry.battle,
      points: entry.points,
      hasTakenPlace: entry.hasTakenPlace,
      users1: entry.users1,
      users2: entry.users2,
      users3: entry.users3,
    });
  });
  
  //console.log(allEntries);
  //console.log ("Check this out: " + allEntries[0].name)

  for (var i = 0; i < allEntries.length; i += parseInt(numberOfTracks)) {
    if (allEntries[i].hasTakenPlace == false) {
      todaysContestants.push(allEntries[i]);
      todaysContestants.push(allEntries[i + 1]);
      todaysContestants.push(allEntries[i + 2]);
      if (i > 2) {
        lastContestants.push(allEntries[i - 3]);
        lastContestants.push(allEntries[i - 2]);
        lastContestants.push(allEntries[i - 1]);
      } else {
        lastContestants.push("No Previous Match");
      }
      break;
    }
  }
  console.log ("Today's Music: " + todaysContestants[0].name + " " + todaysContestants[1].name)
  console.log("Yesterdays Contestants " + lastContestants[0].name )
  return [ todaysContestants, lastContestants, currentRound ];
}
