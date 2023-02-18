function UpdateUser(db, table, username, assignment){
   db.get(table)
      .find({ username: username })
      .assign(assignment)
      .write();
}

function UpdateUserId(db, table, id, assignment){
   db.get(table)
      .find({ userId: id })
      .assign(assignment)
      .write();
}
