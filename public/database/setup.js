function DbDefaultSetup(db) {
  // default db lists
  db.defaults(
    { users: [{ username: "test", message: "test" }] }
  ).write();
}

function GetDb() {
  return db;
}
