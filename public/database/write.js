function UpdateUser(db, table, username, assignment) {
  db.get(table).find({ username: username }).assign(assignment).write();
}

function UpdateUserId(db, table, id, assignment) {
  db.get(table).find({ userId: id }).assign(assignment).write();
}

function UpdateBattleResults(db, table, round, assignment) {
  // bestvgm2022awards
  let dbRoundentry = db
    .get(table)
    .find({ round: round})
    .get("entries")
    .find({ name: assignment.name })
    .assign(assignment)
    .write();
}

function AddEntryToNextRound(db, table, round){
  
}