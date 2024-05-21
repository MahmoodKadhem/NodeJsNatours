const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

// handling uncaught exceptions /////////////////////////////////
process.on('uncaughtException', (err, origin) => {
  console.log(origin);
  console.log(err.name, err.message);
  console.log(err);
  process.exit(1);
});

const app = require('./app')
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


//////////////////////////////////START SERVER///////////////////////
const port = process.env.PORT || 3000
const server = app.listen(port, () => {
  console.log(`app running on port: ${port}`);
});

// handling unhandled rejections /////////////////////////////////
process.on('unhandledRejection', (err, origin) => {
  console.log('UNHANDLED REJECTION ERROR');
  // console.log(origin);
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1)
  });
})

// console.log(x)