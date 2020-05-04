const router = require('express').Router();
const validation = require('../lib/validation');

const ObjectId = require('mongodb').ObjectId;

const photos = require('../data/photos');
const { reviews } = require('./reviews');
// const { photos } = require('./photos');

const { connectToDB } = require("../lib/mongo");
const { getDBReference } = require("../lib/mongo");

exports.router = router;
exports.photos = photos;

/*
 * Schema describing required/optional fields of a photo object.
 */
const photoSchema = {
  userid: { required: true },
  businessid: { required: true },
  caption: { required: false }
};

async function insert_new_photo(photo) {
  const db = getDBReference();  
  const photo_values = {
    userid: photo.userid,
    businessid: photo.businessid,
    caption: photo.caption
  };
  const collection = db.collection('photo');
  const result = await collection.insertOne(photo_values);
  return result.insertedId;
}

/*
 * Route to create a new photo.
 */
router.post('/', async (req, res, next) => {
  if (validation.validateAgainstSchema(req.body, photoSchema)) {
    try {
      const id = await insert_new_photo(req.body);
      res.status(201).send({ id: id });
    } catch (err) {
      res.status(500).send({
        error: "Error inserting lodging into DB."
      });
  }} else {
    res.status(400).json({
      error: "Request body is not a valid photo object"
    });
  }
});


async function get_photos_by_id (iid) {
  const db = getDBReference();
  const collection = db.collection('photo');
  const results = await collection.find({
    id: iid
  }).toArray();
  return results[0];
}

router.get('/lodgings/:id', async (req, res, next) => {
  try {
    const lodging = await
      get_photos_by_id(parseInt(req.params.id));
      if (lodging) {
        res.status(200).send(lodging);
      } else {
        next();
      }
  } catch (err) {
    res.status(500).send({
      error: "Unable to fetch lodging."
    });
  }
});

async function update_photo_by_id  (iid, photo) {
  const db = getDBReference();  
  const photo_values = {
    userid: photo.userid,
    businessid: photo.businessid,
    caption: photo.caption
  };
  const collection = db.collection('photo');
  const result = await collection.replaceOne(
    { id: iid },
    photo_values
  );
  return result.matchedCount > 0;
}

router.put('/lodgings/:id', async (req, res, next) => {
  if (validateAgainstSchema(req.body, photoSchema)) {
    try {
      const updateSuccessful = await
        update_photo_by_id(parseInt(req.params.id), req.body);
      if (updateSuccessful) {
        res.status(200).send({});
      } else {
        next();
      }
    } catch (err) {
      res.status(500).send({
        error: "Unable to update lodging."
      });
    }
  } else {
    res.status(400).send({
      err: "Request body does not contain a valid Lodging."
    });
  }
  
});


async function delete_photo_by_id(iid) {
  const db = getDBReference();  
  const collection = db.collection('photo');
  const result = await collection.deleteOne({
    id: iid
  });
  return result.deletedCount > 0;
}

router.put('/:photoID', async (req, res, next) => {
  try {
    const deleteSuccessful = await
      delete_photo_by_id(parseInt(req.params.id));
    if (deleteSuccessful) {
      res.status(204).end();
    } else {
      next();
    }
  } catch (err) {
    res.status(500).send({
      error: "Unable to delete lodging."
    });
  }
  
});

/*
 * Route to update a photo.
 */
router.put('/:photoID', async function (req, res, next) {
  const photoID = parseInt(req.params.photoID);
  if (validation.validateAgainstSchema(req.body, photoSchema)) {
    try {
      const updateSuccessful = await
        update_photo_by_id(parseInt(req.params.photoID), req.body);
      if (updateSuccessful) {
        res.status(200).send({});
      } else {
        next();
      }
    } catch (err) {
      res.status(500).send({
        error: "Unable to update lodging."
      });
    }
  } else {
    next();
  }
});

async function update_photo_by_id (iid, photo) {
  const db = getDBReference();  
  const businessValues = {
    id: photo.id,
    userid: photo.userid,
    businessid: photo.businessid,
    caption: photo.caption
  };
  const collection = db.collection('photo');
  const result = await collection.replaceOne(
    { id: iid},
    lodgingValues
  );
  return result.matchedCount > 0;
}

async function delete_photo_by_id(iid) {
  const db = getDBReference();  
  const collection = db.collection('photo');
  const result = await collection.deleteOne({
    id: iid
  });
  return result.deletedCount > 0;
}



/*
 * Route to delete a photo.
 */
router.delete('/:photoID', async function (req, res, next) {
  try {
    const deleteSuccessful = await
      delete_photo_by_id(parseInt(req.params.photoID));
    if (deleteSuccessful) {
      res.status(204).end();
    } else {
      next();
    }
  } catch (err) {
    res.status(500).send({
      error: "Unable to delete lodging."
    });
  }
});