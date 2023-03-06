function UpdateUser(db, table, username, assignment) {
  db.get(table).find({ username: username }).assign(assignment).write();
}

function UpdateUserId(db, table, id, assignment) {
  db.get(table).find({ userId: id }).assign(assignment).write();
}

function UpdateBattleResults(db, table, round, assignments) {
  // bestvgm2022awards
  assignments.forEach((entry) => {
    let dbRoundentry = db
      .get(table)
      .find({ round: round })
      .get("entries")
      .find({ name: entry.name })
      .assign(entry)
      .write();
  });
}

async function UpdateCurrentBattleToTrue(db, table, round) {
  // Getting round info
  console.log("In UpdateCurrentRoundToTrue")
  var entriesForRound = await GetCurrentBattle(db, table, round);
  if (entriesForRound == false) {
    return false;
  } else {
    console.log("Setting round to ran" + entriesForRound[0]);
    entriesForRound.forEach((entry) => {
      entry.hasTakenPlace = true;
      let dbRoundentry = db
        .get(table)
        .find({ round: round })
        .get("entries")
        .find({ name: entry.name })
        .assign(entry)
        .write();
    });
  }
}

async function UpdateAlertedUsers(db, table, round, users = []) {
  let dbRoundentry = db
    .get(table)
    .find({ round: round })
    .get("alertedToday")
    .assign(users)
    .write();
}

async function UpdateRoundCompleted(db, table, round) {
  var roundToUpdate = parseInt(round)
  let dbRoundentry = db
    .get(table)
    .find({ round: roundToUpdate })
    .get("isCurrentRound")
    .assign(false)
    .write();
  
  let dbNextRoundentry = db
    .get(table)
    .find({ round: (roundToUpdate + 1) })
    .get("isCurrentRound")
    .assign(true)
    .write();
}


async function UpdateDbWithBattleResults(
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

async function AddWinnerToNextRound(db, table, round, assignment) {
  var roundToUpdate = parseInt(round)
 
  let dbNextRoundentry = db
    .get(table)
    .find({ round: (roundToUpdate + 1) })
    .push(assignment)
    .write();
}