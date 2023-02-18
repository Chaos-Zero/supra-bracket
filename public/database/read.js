function GetDbUsers(db, tableName) {
  var dbUsers = [];
  var users = db.get(tableName).value();
  users.forEach(function(user) {
    dbUsers.push([user.username]); // adds their info to the dbUsers value
  });
  return dbUsers;
}

function GetDataForUser(db, tableName, username) {
  return db
    .get(tableName)
    .find({ username: username })
    .value();
}

function GetDbTable(db, table) {
  return db.get(table).value();
}
