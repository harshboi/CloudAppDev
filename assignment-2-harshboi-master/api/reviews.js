const router = require('express').Router();
const validation = require('../lib/validation');

const reviews = require('../data/reviews');
const { connectToDB } = require("../lib/mongo");
const { getDBReference } = require("../lib/mongo");
exports.router = router;
exports.reviews = reviews;

/*
 * Schema describing required/optional fields of a review object.
 */
const reviewSchema = {
  userid: { required: true },
  businessid: { required: true },
  dollars: { required: true },
  stars: { required: true },
  review: { required: false }
};


/*
 * Route to create a new review.
 */
router.post('/', async function (req, res, next) {
  if (validation.validateAgainstSchema(req.body, reviewSchema)) {
    const review = validation.extractValidFields(req.body, reviewSchema);
    try{
      const id = await insert_new_review(req.body);
      res.status(201).send({
        id: id
      });
    } catch (err) {
      console.error(err);
      res.status(500).send({
      error: "Error inserting reviews.  Try again later."
    });
  }
  } else {
    res.status(400).send({
      error: "Request body is not a valid review object"
    });
  }
});

async function insert_new_review (review) {
  const db = getDBReference();  
  const reviewDocument = {
    id: review.id,
    userid: review.userid,
    businessid: review.businessid,
    dollars: review.dollars,
    stars: review.stars,
    reviews: review.reviews
  };
  const reviewCollection = db.collection('review');
  return reviewCollection.insertOne(reviewDocument) 
    .then((result) => {
      return Promise.resolve(result.insertedId);
    });
}

/*
 * Route to fetch info about a specific review.
 */
router.get('/:reviewID', async function (req, res, next) {
  try {
    const review = await
      get_review_by_id(parseInt(req.params.reviewID));
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
    id: iid
  }).toArray();
  return results[0];
}


/*
 * Route to update a review.
 */
router.put('/:reviewID', async function (req, res, next) {
  const reviewID = parseInt(req.params.reviewID);
  if (validation.validateAgainstSchema(req.body, reviewSchema)) {
    try {
      const updateSuccessful = await
        update_review_by_id(parseInt(req.params.reviewID), req.body);
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


async function update_review_by_id (iid, review) {
  const db = getDBReference();  
  const reviewValues = {
    id: review.id,
    userid: review.userid,
    businessid: review.businessid,
    dollars: review.dollars,
    stars: review.stars,
    reviews: review.reviews
  };
  const reviewCollection = db.collection('review');
  const result = await reviewCollection.replaceOne(
    { id: iid },
    reviewValues
  );
  return result.matchedCount > 0;
}

async function delete_review_by_id(iid) {
  const db = getDBReference();  
  const collection = db.collection('review');
  const result = await collection.deleteOne({
    id: iid
  });
  return result.deletedCount > 0;
}

/*
 * Route to delete a review.
 */
router.delete('/:reviewID', async function (req, res, next) {
  try {
    const deleteSuccessful = await
      delete_review_by_id(parseInt(req.params.reviewID));
    if (deleteSuccessful) {
      res.status(204).end();
    } else {
      next();
    }
  } catch (err) {
    res.status(500).send({
      error: "Unable to delete review."
    });
  }
});
