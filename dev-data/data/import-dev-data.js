const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel')

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);
// console.log(process.env);
mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true
}).then(con => {
  // console.log(con.connections);
  console.log("connected to the database")
});

// read the json file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'));

// import data to the database
const importData = async () => {
  try {
    // console.log(tours)
    await Tour.create(tours);
    console.log('data successfully loaded');
  } catch (err) {
    console.log(err)
  }
  process.exit();
}

// delete all data from collections
const deleteAllData = async () => {
  try {
    await Tour.deleteMany();
    console.log('data successfully deleted')
  } catch (err) {
    console.log(err)
  }
  process.exit();
}

if (process.argv[2] === "--import") {
  importData();
};
if (process.argv[2] === "--delete") {
  deleteAllData();
};