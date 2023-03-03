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
