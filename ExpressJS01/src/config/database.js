require('dotenv').config();
const mongoose = require('mongoose');

const dbState = [{
  value: 0,
  label: "Disconnected"
}, {
  value: 1,
  label: "Connected"
}, {
  value: 2,
  label: "Connecting"
}, {
  value: 3,
  label: "Disconnecting"
}];

const connection = async () => {
  try {
    const options = {
      user: '',
      pass: '',
      dbName: 'fullstack02'
    };
    await mongoose.connect(process.env.MONGO_DB_URL);
    const state = Number(mongoose.connection.readyState);
    console.log(dbState.find(f => f.value === state).label, "to database");
  } catch (err) {
    console.log("Error connecting to database:", err);
  }
};

module.exports = connection;