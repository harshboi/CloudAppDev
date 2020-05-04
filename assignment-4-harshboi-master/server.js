const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const api = require('./api');
const { connectToDB } = require('./lib/mongo');
const {getFileDownloadStreamById} = require('./models/photo');
const { connectToRabbitMQ, getChannel } = require('./lib/rabbitmq');
const amqp = require('amqplib');

const app = express();
const port = process.env.PORT || 8000;

/*
 * Morgan is a popular logger.
 */
app.use(morgan('dev'));

app.use(bodyParser.json());
app.use(express.static('public'));


const rabbitmqHost = process.env.RABBITMQ_HOST;
const rabbitmqUrl = `amqp://${rabbitmqHost}`;

/*
 * All routes for the API are written in modules in the api/ directory.  The
 * top-level router lives in api/index.js.  That's what we include here, and
 * it provides all of the routes.
 */
app.use('/', api);


// app.use('/media/images',
//   express.static(`${__dirname}/api/uploads`), 
// );

app.get('/media/photos/:id', (req, res, next) => {
  var urlhead = req.params.id;
  urlhead = urlhead.split("-");
  urlhead = urlhead[0];
  console.log("The id is : ", urlhead);

  getFileDownloadStreamById(urlhead)
    .on('error', (err) => {
      if (err.code === 'ENOENT') {
        res.status(404).send({
          error: "Valid size not provided"
        });
      } else {
        res.status(500).send({
          error: " try again later."
        });
      }
    })
    .on('file', (file) => {
      res.status(200).type(file.metadata.contentType);
    })
    .pipe(res);
});


connectToDB(async () => {
  // try{
   await connectToRabbitMQ('images');
    app.listen(port, () => {
      // console.log("The url is: ",rabbitmqUrl);
      console.log("== Server is running on port", port);
    });
  // } catch(err){
  //   console.log("Cannot run server: ",err);
  // }

});