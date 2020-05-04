const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const { connectToDB } = require("./lib/mongo");

const api = require('./api');

const app = express();
const port = process.env.PORT || 9000;

let db = null;
const mongoHost = process.env.MONGO_HOST;
const mongoPort = process.env.MONGO_PORT || '27017';
const mongoDBName = process.env.MONGO_DATABASE;
const mongoUser = process.env.MONGO_USER;
const mongoPassword = process.env.MONGO_PASSWORD;

// const mongoURL = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDBName}`
const mongoUrl = `mongodb://harsh:hunter2@localhost:27017/yelp`;

console.log("== Mongo URL:", mongoUrl);

/*
 * Morgan is a popular logger.
 */
app.use(morgan('dev'));

app.use(bodyParser.json());
app.use(express.static('public'));

/*
 * All routes for the API are written in modules in the api/ directory.  The
 * top-level router lives in api/index.js.  That's what we include here, and
 * it provides all of the routes.
 */
app.use('/', api);

app.use('*', function (req, res, next) {
  res.status(404).json({
    error: "Requested resource " + req.originalUrl + " does not exist"
  });
});

connectToDB(() => {
  app.listen(port, () => {
    console.log("Connect ESTABLISHED");
    console.log("== Server is running on port", port);
  });
});


// MongoClient.connect(mongoUrl, function (err, client) {
//   if (!err) {
//     app.locals.mongoDB = client.db('yelp');
//     db = client.db('yelp')
//     app.listen(port, function() {
//       console.log("Connect ESTABLISHED");
//       console.log("== Server is running on port", port);
//     });
//   }
//   else {
//     console.log("DB COnnection not established");
//   }
// });

