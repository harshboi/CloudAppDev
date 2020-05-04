const router = require('express').Router();

const { getBusinessesByOwnerId } = require('../models/business');
const { getReviewsByUserId } = require('../models/review');
const { getPhotosByUserId } = require('../models/photo');
const { insertNewUser, getUserById, getUserByEmail, validateUser, isAdmin } = require('../lib/user')
const { generateAuthToken, requireAuthentication } = require('../lib/auth');

/*
 * Route to list all of a user's businesses.
 */
router.get('/:id/businesses', requireAuthentication,async (req, res, next) => {
  // console.log("isadmin is ", await isAdmin(req.user), req.user);  
  const is_admin = await isAdmin(req.user)
  // console.log("isadmin.count is", is_admin.id)
  if (req.params.id == req.user || is_admin.id > 0) {  
    try {
      const businesses = await getBusinessesByOwnerId(parseInt(req.params.id));
      if (businesses) {
        res.status(200).send({ businesses: businesses });
      } else {
        next();
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Unable to fetch businesses.  Please try again later."
      });
    }
  } else {
    res.status(403).json({
      error: "Unauthorized to access the specified resource"
    });
  }
});

/*
 * Route to list all of a user's reviews.
 */
router.get('/:id/reviews', requireAuthentication, async (req, res, next) => {
  const is_admin = await isAdmin(req.user)
  if (req.params.id == req.user || is_admin.id > 0) {   
    try {
      const reviews = await getReviewsByUserId(parseInt(req.params.id));
      if (reviews) {
        res.status(200).send({ reviews: reviews });
      } else {
        next();
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Unable to fetch reviews.  Please try again later."
      });
    }
  } else { 
    res.status(403).json({
      error: "Unauthorized to access the specified resource"
    });
  }
});

/*
 * Route to list all of a user's photos.
 */
router.get('/:id/photos', requireAuthentication, async (req, res, next) => {
  const is_admin = await isAdmin(req.user)
  if (req.params.id == req.user || is_admin.id > 0) {   
    try {
      const photos = await getPhotosByUserId(parseInt(req.params.id));
      if (photos) {
        res.status(200).send({ photos: photos });
      } else {
        next();
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Unable to fetch photos.  Please try again later."
      });
    }
  } else {
    res.status(403).json({
      error: "Unauthorized to access the specified resource"
    });
  }
});

router.post('/createAccount', requireAuthentication, async (req, res, next) => {
  console.log(" ==createAccount body", req.body);
  const is_admin = await isAdmin(req.user)
  try {
    if (req.body.admin || is_admin.id > 0) {
      const result = await insertNewUser(req.body, req.body.admin);
      res.status(200).send(result);
    }
    // else if (req.body.email) {
      // const result = await insertNewUser(req.body, 0);
      // res.status(200).send(result);
    // }
    else {
      res.status(400).send({
        error: "Request body does not contain a valid User."
      });
    }
  }
  catch (err) {
    res.status(500).send({
      err: "Error in createAccount"
    });
  }
});

router.get('/getAccountById/:id', requireAuthentication, async (req, res, next) => {
  console.log("req.params.id is,", req.params.id, req.user);
  if (req.params.id == req.user) {
    try {
      const result = await getUserById(Number(req.params.id), false);
      res.status(200).send(result);
    }
    catch (err) {
      res.status(500).send({
        err: "Account ID does not exist"
      });
    }
  }
  else {
    res.status(403).json({
      error: "Unauthorized to access the specified resource"
    });  
  }
});

module.exports = router;

router.post('/login', async function (req, res) {
  try {
    const authenticated =
      await validateUser(req.body.email, req.body.password);
    console.log("Authenticated is ", authenticated);
    if (authenticated) {
        // console.log("req.body.id is", req.body.id);
        const credentials = await getUserByEmail(req.body.email, false);
        console.log("crededntials is ", credentials);
    const token = generateAuthToken(credentials.id);
        res.status(200).send({token: token});
    } else {
      res.status(401).send({
        error: "Invalid authentication credentials"
      });
    }
  } catch (err) {
    res.status(500).send({
      error: "Error logging in.  Try again later."
    });
  } 
});