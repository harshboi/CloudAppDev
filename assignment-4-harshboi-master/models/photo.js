/*
 * Photo schema and data accessor methods.
 */

const { ObjectId, GridFSBucket } = require('mongodb');
const fs = require('fs');
const { getDBReference } = require('../lib/mongo');
const { extractValidFields } = require('../lib/validation');

/*
 * Schema describing required/optional fields of a photo object.
 */
const PhotoSchema = {
  businessId: { required: true },
  caption: { required: false }
};
exports.PhotoSchema = PhotoSchema;

/*
 * Executes a DB query to insert a new photo into the database.  Returns
 * a Promise that resolves to the ID of the newly-created photo entry.
 */
async function insertNewPhoto(photo) {
  photo = extractValidFields(photo, PhotoSchema);
  photo.businessId = ObjectId(photo.businessId);
  const db = getDBReference();
  const collection = db.collection('photos');
  // console.log("The photo is: ",photo);
  const result = await collection.insertOne(photo);
  return result.insertedId;
}
exports.insertNewPhoto = insertNewPhoto;

/*
 * Executes a DB query to fetch a single specified photo based on its ID.
 * Returns a Promise that resolves to an object containing the requested
 * photo.  If no photo with the specified ID exists, the returned Promise
 * will resolve to null.
 */
async function getPhotoById(id) {
  const db = getDBReference();
  const collection = db.collection('photos');
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const results = await collection
      .find({ _id: new ObjectId(id) })
      .toArray();
    return results[0];
  }
}
exports.getPhotoById = getPhotoById;

/*
 * Executes a DB query to fetch all photos for a specified business, based
 * on the business's ID.  Returns a Promise that resolves to an array
 * containing the requested photos.  This array could be empty if the
 * specified business does not have any photos.  This function does not verify
 * that the specified business ID corresponds to a valid business.
 */
async function getPhotosByBusinessId(id) {
  const db = getDBReference();
  const bucket = new GridFSBucket(db, { bucketName: 'photos' });
  // const results = await bucket.find({'length': lookup}).toArray();
  const results = await bucket.find({ 'metadata.businessId':id }).toArray();
  // console.log("The photos for this business are: ", results[0]);
  if (results[0]) {
    return results;
  } else {
    return [];
  }



}
exports.getPhotosByBusinessId = getPhotosByBusinessId;



exports.getImageInfoById = async function (id) {
  const db = getDBReference();
  // const collection = db.collection('photos');
  const bucket = new GridFSBucket(db, { bucketName: 'photos' });
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const results = await bucket.find({ _id: new ObjectId(id) })
      .toArray();
      console.log("The results of get image info are:  ",results[0]);
    return results[0];
  }
};


exports.saveImageInfo = async function (image) {
  const db = getDBReference();
  const collection = db.collection('photos');
  const result = await collection.insertOne(image);
  return result.insertedId;
};


exports.saveImageFile = function (image) {
  return new Promise((resolve, reject) => {
    const db = getDBReference();
    const bucket = new GridFSBucket(db, { bucketName: 'photos' });

    const metadata = {
      contentType: image.contentType,
      businessId: image.businessId,
      Caption:image.Caption
    };
    // console.log("Saving the following image:  ", image);
    const uploadStream = bucket.openUploadStream(
      image.filename,
      { metadata: metadata }
    );
    // console.log("UploadStream is: ", uploadStream);
    fs.createReadStream(image.path)
      .pipe(uploadStream)
      .on('error', (err) => {
        reject(err);
      })
      .on('finish', (result) => {
        resolve(result._id);
      });
  });
};


exports.isValidBusiness = function(id){
  const db = getDBReference();
  const collection = db.collection('businesses');
  if(ObjectId.isValid(id)){
    return true;
  }else{
    return false;
  }

}

exports.getDownloadStreamByFilename = function (filename) {
  const db = getDBReference();
  const bucket = new GridFSBucket(db, { bucketName: 'photos' });
  return bucket.openDownloadStreamByName(filename);
};
//
exports.getFileDownloadStreamById = function (id) {
  const db = getDBReference();
  const bucket = new GridFSBucket(db, { bucketName: 'photos' });
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    return bucket.openDownloadStream(new ObjectId(id));
  }
};

exports.updateImageSizeById = async function (id, object,second) {
  const db = getDBReference();
  const collection = db.collection('photos.files');
  if (!ObjectId.isValid(id)) {
    return null;
  } else {

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { "metadata.resizedImages": object, "metadata.url":second }}
    );
    console.log("ASCASCA", object);
    console.log("ASCASCA", second);
    return result.matchedCount > 0;
  }
};
  