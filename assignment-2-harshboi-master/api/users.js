const router = require('express').Router();

exports.router = router;

const { businesses } = require('./businesses');
const { reviews } = require('./reviews');
const { photos } = require('./photos');
const { connectToDB } = require("../lib/mongo");
const { getDBReference } = require("../lib/mongo");

/*
 * Route to list all of a user's businesses.
 */
router.get('/:userid/businesses', async function (req, res) {
  try {
    const business = await
      get_business_by_id(parseInt(req.params.userid));
      if (business) {
        res.status(200).send(business);
      } else {
        next();
      }      
  } catch(err) {
    res.status(500).json({
    error: "Failed to fetch user."
    })
  }

async function get_business_by_id (iid) {
    const db = getDBReference();
    const collection = db.collection('businesses');
    const results = await collection.find({
      userid: iid
    }).toArray();
    return results[0];
  }
});

/*
 * Route to list all of a user's reviews.
 */
router.get('/:userid/reviews', async function (req, res) {
  try {
    const review = await
      get_review_by_id(parseInt(req.params.userid));
      if (review) {
        res.status(200).send(review);
      } else {
        next();
      }      
  } catch(err) {
    res.status(500).json({
    error: "Failed to fetch review."
    })
  }
});

async function get_review_by_id (iid) {
  const db = getDBReference();
  const collection = db.collection('review');
  const results = await collection.find({
    userid: iid
  }).toArray();
  return results;
}

/*
 * Route to list all of a user's photos.
 */
router.get('/:userid/photos', async function (req, res) {
  const userid = parseInt(req.params.userid);
  try {
    const lodging = await
      get_photos_by_id(parseInt(req.params.userid));
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

async function get_photos_by_id (iid) {
  const db = getDBReference();
  const collection = db.collection('photo');
  const results = await collection.find({
    userid: iid
  }).toArray();
  return results;
}