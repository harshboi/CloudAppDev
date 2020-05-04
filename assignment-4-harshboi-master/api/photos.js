/*
 * API sub-router for businesses collection endpoints.
 */
const { connectToRabbitMQ, getChannel } = require('../lib/rabbitmq');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const router = require('express').Router();
const { getImageInfoById, saveImageInfo, saveImageFile, getDownloadStreamByFilename, isValidBusiness,getFileDownloadStreamById } = require('../models/photo');
const { validateAgainstSchema } = require('../lib/validation');
const {
  PhotoSchema,
  insertNewPhoto,
  getPhotoById
} = require('../models/photo');

const imageTypes = {
  'image/jpeg': 'jpg',
  'image/png':'png'
};

const upload = multer({
  storage: multer.diskStorage({
    destination: `${__dirname}/uploads`,
    filename: (req, file, callback) => {
      const basename = crypto.pseudoRandomBytes(16).toString('hex');
      const extension = imageTypes[file.mimetype];
      callback(null, `${basename}.${extension}`);
    }
  }),
  fileFilter: (req, file, callback) => {
    callback(null, !!imageTypes[file.mimetype])
  }
});


function removeUploadedFile(file) {
  return new Promise((resolve, reject) => {
    fs.unlink(file.path, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

}




/*
 * Route to create a new photo.
 */
router.post('/', upload.single('image'), async (req, res,next) => {

  if(req.file && req.body && req.body.businessId){
      try {
        const image = {
          path: req.file.path,
          filename: req.file.filename,
          contentType: req.file.mimetype,
          businessId: req.body.businessId,
          Caption: req.body.Caption
        };
        // console.log("The image contains this data: ", image);
      const valid_biz = isValidBusiness(image.businessId);
      if(valid_biz == false){
        res.status(400).send({
          err: "Valid business id not entered, try again"
        });
      }

      const id = await saveImageFile(image);
      await removeUploadedFile(req.file);
      const channel = getChannel();
      channel.sendToQueue('images',Buffer.from(id.toString()));


      res.status(200).send({ id: id });
    } catch (err) {
      next(err);
    }
  } else {
    res.status(400).send({
      err: "Request body was invalid."
    });
  }

});

/*
 * Route to fetch info about a specific photo.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const image = await getImageInfoById(req.params.id);
    if (image) {
      // delete image.path;
      // image.url = `/media/images/${image.filename}`;
      // console.log("The urls are: ", image.metadata.url);

      const responseBody = {
        _id: image._id,
        resizedImages: image.metadata.resizedImages,
        contentType: image.metadata.contentType,
        businessId: image.metadata.businessId,
        url: image.metadata.url,
        Caption: image.metadata.Caption
        // Dimensions: image.metadata.size
      };
      // console.log("The biz id is: ",image);
      res.status(200).send(responseBody);
    } else {
        res.status(403).send({
          error: "Unable to find photo.  Please try a different valid id."
        });
    }
  } catch (err) {
      res.status(500).send({
        error: "Unable to fetch photo.  Please try again later."
      });
  }
});




module.exports = router;
