const router = require('express').Router();
const validation = require('../lib/validation');

const ObjectId = require('mongodb').ObjectId;

const businesses = require('../data/businesses');
const { reviews } = require('./reviews');
const { photos } = require('./photos');

const { connectToDB } = require("../lib/mongo");
const { getDBReference } = require("../lib/mongo");

exports.router = router;
exports.businesses = businesses;

const db = getDBReference();


/*
 * Schema describing required/optional fields of a business object.
 */
const businessSchema = {
  ownerid: { required: true },
  name: { required: true },
  address: { required: true },
  city: { required: true },
  state: { required: true },
  zip: { required: true },
  phone: { required: true },
  category: { required: true },
  subcategory: { required: true },
  website: { required: false },
  email: { required: false }
};

/*
 * Route to return a list of businesses.
 */
router.get('/', async (req, res) => {
  if (validation.validateAgainstSchema(req.body, businessSchema)) {
    try{
      const business_page = await getbusinessPage(parseInt(req.query.page) || 1);
      res.status(200).send(business_page);
    } catch (err) {
    res.status(500).send({
      error: "Error fetching business. blah  Try again later."
    });
  }
  } else {
    res.status(400).json({
      error: "Request body is not a valid business object"
    });
  }
});

/*
 * Route to create a new business.
 */
router.post('/', async (req, res, next) => {
  if (validation.validateAgainstSchema(req.body, businessSchema)) {
    try{
      const id = await insert_new_business(req.body);
      res.status(201).send({
        id: id
      });
    } catch (err) {
      console.error(err);
      res.status(500).send({
      error: "Error inserting business.  Try again later."
    });
  }
  } else {
    res.status(400).send({
      error: "Request body is not a valid business object"
    });
  }
});

async function get_business_by_id (iid) {
  const db = getDBReference();
  const collection = db.collection('businesses');
  const results = await collection.find({
    id: iid
  }).toArray();
  return results[0];
}
/*
 * Route to fetch info about a specific business.
 */
router.get('/:businessid', async (req, res, next) => {
  try {
    const business = await
      get_business_by_id(parseInt(req.params.businessid));
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
});


async function update_business_by_id (iid, business) {
  const db = getDBReference();  
  const businessValues = {
    name: business.name,
    description: business.description,
    street: business.street,
    city: business.city,
    state: business.state,
    zip: business.zip,
    price: business.price,
    ownerid: business.ownerID
  };
  const collection = db.collection('business');
  const result = await collection.replaceOne(
    { id: iid },
    businessValues
  );
  return result.matchedCount > 0;
}

router.put('/businesses/:id', async (req, res, next) => {
  if (validateAgainstSchema(req.body, businessSchema)) {
    try {
      const updateSuccessful = await
        update_business_by_id(parseInt(req.params.id), req.body);
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


async function delete_business_by_id(iid) {
  const db = getDBReference();  
  const collection = db.collection('businesses');
  const result = await collection.deleteOne({
    id: iid
  });
  return result.deletedCount > 0;
}

router.delete('/:businessid', async (req, res, next) => {
  try {
    const deleteSuccessful = await
      delete_business_by_id(parseInt(req.params.businessid));
    if (deleteSuccessful) {
      res.status(204).end();
    } else {
      next();
    }
  } catch (err) {
    res.status(500).send({
      error: "Unable to delete business."
    });
  }
});


async function insert_new_business (business) {
  const db = getDBReference();  
  const businessDocument = {
    id: business.ownerid,
    name: business.name,
    address: business.email,
    city: business.city,
    state: business.state,
    zip: business.zip,
    phone: business.phone,
    category:  business.category,
    subcategory: business.subcategory,
    website:  business.website
  };
  const businessCollection = db.collection('businesses');
  return businessCollection.insertOne(businessDocument) 
    .then((result) => {
      return Promise.resolve(result.insertedId);
    });
}




getbusinessPage = async function (page) {
  console.log("Count is ");
  const db = getDBReference();
  const collection = db.collection('businesses');
  const count = await collection.countDocuments();
  console.log("Count is ", count);

  const pageSize = 10;
  const lastPage = Math.ceil(count / pageSize);
  page = page < 1 ? 1 : page;
  page = page > lastPage ? lastPage : page;
  const offset = (page - 1) * pageSize;

  const results = await collection.find({})
    .sort({ _id: 1 })
    .skip(offset)
    .limit(pageSize)
    .toArray();

  return {
    businesses: results,
    page: page,
    totalPages: lastPage,
    pageSize: pageSize,
    count: count
  };
};

// insert_new_business = async function (business) {
//   // const lodgingToInsert = extractValidFields(lodging);
//   const db = getDBReference();
//   const collection = db.collection('businesses');
//   const result = await collection.insertOne(business);
//   return result.insertedId;
// };