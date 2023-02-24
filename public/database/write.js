function UpdateUser(db, table, username, assignment) {
  db.get(table).find({ username: username }).assign(assignment).write();
}

function UpdateUserId(db, table, id, assignment) {
  db.get(table).find({ userId: id }).assign(assignment).write();
}

function UpdateBattleResults(db, table, round, songName, assignment) {
  // bestvgm2022awards
  let dbRoundentry = db
    .get(table)
    .find({ round: "1" })
    .get("entries")
    .find({ name: songName })
    .push({
      hasTakenPlace: assignment.isCompleted,
      points: assignment.points,
      users1: assignment.users1,
      users2: assignment.users2,
      users3: assignment.users3,
    })
    .write();
}

function AddEntryToNextRound(db, table, round){
  
}