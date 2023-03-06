const sleep = require("util").promisify(setTimeout);

function GetDbTable(db, table) {
  return db.get(table).value();
}

// The name of this funciton is misleading.
// If no entries are found, GetRoundEntries returns true instead of populating.
function GetAllRoundEntries(db, tournamentName, currentRound, allEntries) {
  var entries = db
    .get(tournamentName)
    .find({ round: currentRound })
    .get("entries")
    .value();

  entries.every(function (entry) {
    if (allEntries.length == 3) {
      return false;
    }
    if (entry.hasTakenPlace == false) {
      allEntries.push({
        name: entry.name,
        link: entry.link,
        battle: entry.battle,
        points: entry.points,
        hasTakenPlace: entry.hasTakenPlace,
        usersFirstPick: entry.usersFirstPick,
        usersSecondPick: entry.usersSecondPick,
        usersDidNotPlace: entry.usersDidNotPlace,
      });
    }
    return true;
  });
}

async function GetCurrentBattle(db, tournamentName, numberOfTracks) {
  console.log("In GetCurrentBattle");
  var currentTournament = db.get(tournamentName).value();
  //console.log(currentTournament);
  sleep(500);
  var currentRound;
  currentTournament.every(function (round) {
    if (round.isCurrentRound == true) {
      console.log("Looping through rounds");
      currentRound = round.round;
      //console.log(currentRound);
      return false;
    }
    return true;
  });

  var allEntries = [];
  var upcomingContestants = [];

  for (var i = 0; i < allEntries.length; i += parseInt(numberOfTracks)) {
    if (allEntries[i].hasTakenPlace == false) {
      upcomingContestants.push(allEntries[i]);
      upcomingContestants.push(allEntries[i + 1]);
      upcomingContestants.push(allEntries[i + 2]);
      break;
    }
  }
  console.log("Completed GetCurrentBattle");
  return upcomingContestants;
}

function GetAllEmbedsEntries(db, tournamentName, currentRound, allEntries) {
  var entries = db
    .get(tournamentName)
    .find({ round: currentRound })
    .get("entries")
    .value();

  //console.log(entries);
  entries.forEach(function (entry) {
    allEntries.push({
      name: entry.name,
      link: entry.link,
      battle: entry.battle,
      points: entry.points,
      hasTakenPlace: entry.hasTakenPlace,
      usersFirstPick: entry.usersFirstPick,
      usersSecondPick: entry.usersSecondPick,
      usersDidNotPlace: entry.usersDidNotPlace,
    });
  });
}

async function GetNextTournamentRoundFunc(
  db,
  tournamentName,
  currentTournament,
  currentRound,
  numberOfTracks,
  todaysContestants,
  lastContestants
) {
  var allEntries = [];

  //console.log(entries.length);
  GetAllEmbedsEntries(db, tournamentName, currentRound, allEntries);

  //console.log(allEntries);
  //console.log ("Check this out: " + allEntries[0].name)

  for (var i = 0; i < allEntries.length; i += parseInt(numberOfTracks)) {
    if (allEntries[i].hasTakenPlace == false) {
      todaysContestants.push(allEntries[i]);
      todaysContestants.push(allEntries[i + 1]);
      todaysContestants.push(allEntries[i + 2]);
      if (i > 2 && lastContestants.length < 1) {
        lastContestants.push(allEntries[i - 3]);
        lastContestants.push(allEntries[i - 2]);
        lastContestants.push(allEntries[i - 1]);
      }
      break;
    }
    if (i == allEntries.length - (parseInt(numberOfTracks)) ) {
      console.log("We should have gotten to the last entry in the list");
      lastContestants.push(allEntries[i - 3]);
      lastContestants.push(allEntries[i - 2]);
      lastContestants.push(allEntries[i - 1]);
    }
  }
}

async function GetNextTournamentRound(db, tournamentName, numberOfTracks) {
  var currentTournament = await db.get(tournamentName).value();
  //console.log(currentTournament);
  sleep(5000);
  var startingRound;
  currentTournament.every(function (round) {
    if (round.isCurrentRound == true) {
      startingRound = parseInt(round.round);
      //console.log(currentRound);
      return false;
    }
    return true;
  });

  var currentRound = startingRound;
  var lastContestants = [];
  var todaysContestants = [];

  do {
    await GetNextTournamentRoundFunc(
      db,
      tournamentName,
      currentTournament,
      currentRound,
      numberOfTracks,
      todaysContestants,
      lastContestants
    );
    console.log("The ammount we have found: " + todaysContestants);
    if (todaysContestants.length < 3) {
      currentRound = parseInt(currentRound) + 1;
    }
  } while (todaysContestants.length < 3);
  console.log("We are out of the do while");
  return [todaysContestants, lastContestants, currentRound, startingRound];
}

async function GetAlertedUsers(db, tournamentName, round) {
  return db
    .get(tournamentName)
    .find({ round: round })
    .get("alertedToday")
    .value();
}

async function GetCurrentRound(db, tournamentName) {
  console.log("Tournament Name: " + tournamentName);
  var currentTournament = await db.get(tournamentName).value();
  console.log(currentTournament);
  sleep(500);
  var currentRound;
  currentTournament.every(function (round) {
    if (round.isCurrentRound == true) {
      currentRound = round.round;
      //console.log(currentRound);
      return false;
    }
    return true;
  });
  return currentRound;
}

// Not use in production. 
async function wasLastBattleTie(db, tournamentName, currentRound)
{
  return db
    .get(tournamentName)
    .find({ round: currentRound })
    .get("thereWasTieLastBattle")
    .value();
}