/*
 * User schema and data accessor methods.
 */

// const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const mysqlPool = require('../lib/mysqlPool');
const { extractValidFields } = require('../lib/validation');

const { validateAgainstSchema } = require('../lib/validation')
/*
 * Schema for a User.
 */
const UserSchema = {
  name: { required: true },
  email: { required: true },
  password: { required: true },
};
exports.UserSchema = UserSchema;


/*
 * Insert a new User into the DB.
 */
exports.insertNewUser = async function (user, admin) {
  return new Promise(async (resolve, reject) => {
    try{
      if (validateAgainstSchema(user, UserSchema)){
        const userToInsert = extractValidFields(user, UserSchema);
        const passwordHash = await bcrypt.hash(userToInsert.password, 8);
        console.log("Inside insert new user");
        // console.log("Hashed password is: ", passwordHash, " usertoinsert test: ", userToInsert.name);
        mysqlPool.query('INSERT INTO users (name, email, password, admin) VALUES (?, ?, ?, ?)', 
            [ userToInsert.name,userToInsert.email, 
              passwordHash, admin ], (err, results) => {
          if (err) {
            console.log("DB INSERTION FAILED");
            reject(err);
          } else {
            console.log("DB INSERTION SUCCESSFULL ", results);
            resolve({
              id: results.insertId
            });
          }
        });
      }
    }
    catch (err) {
      console.log("In catch block", err);
    }
  });
};
//   const db = getDBReference();
//   const collection = db.collection('users');

//   const passwordHash = await bcrypt.hash(userToInsert.password, 8);
//   userToInsert.password = passwordHash;

//   const result = await collection.insertOne(userToInsert);
//   return result.insertedId;
// };


/*
 * Fetch a user from the DB based on user ID.
 */
async function getUserById(idd, includePassword) {
  return new Promise(async (resolve, reject) => {
    if (idd == 1) {
        console.log("MATCH");
      }
      console.log("id is",idd);
    try{
      mysqlPool.query('SELECT id, name, email, admin, password FROM users WHERE (id = ?)', 
          [ idd ], (err, results) => {
      if (err) {
        console.log("UserID not found");
        reject(err);
      } else {
        if (includePassword == false) {
          resolve({
            id: results[0].id,
            name: results[0].name,
            email: results[0].email
          });
        } else {
          resolve({
            id: results[0].id,
            name: results[0].name,
            email: results[0].email,
            password: results[0].password
          });
        }
        // return results.id;
        // console.log(results);
      }
      });
    }
    catch (err) {
      console.log("Error in getuserbyid function");
    }
  // else {
  //   res.status(400).send({
  //     error: "Request body does not contain a valid User."
  //   });
  // }
  // const db = getDBReference();
  // const collection = db.collection('users');
  // if (!ObjectId.isValid(id)) {
  //   return null;
  // } else {
  // const projection = includePassword ? {} : { password: 0 };
  //   const results = await collection
  //     .find({ _id: new ObjectId(id) })
  //     .project(projection)
  //     .toArray();
  //   return results[0];
  // }
  });
}

exports.getUserById = getUserById;
exports.getUserByEmail = getUserByEmail;

async function getUserByEmail (email, includePassword) {
  return new Promise(async (resolve, reject) => {
    try{
      mysqlPool.query('SELECT id, name, email, admin, password FROM users WHERE (email = ?)', 
          [ email ], (err, results) => {
      if (err) {
        console.log("EmailID not found (SQL Syntax error)");
        reject(err);
      } else {
        if (results == []) {
          next()
        }
        if (includePassword == false) {
          resolve({
            id: results[0].id,
            name: results[0].name,
            email: results[0].email
          });
        } else {
        resolve({
            id: results[0].id,
            name: results[0].name,
            email: results[0].email,
            password: results[0].password
          });
        }
        // return results.id;
        // console.log(results);
      }
      });
    }
    catch (err) {
      console.log("Error in getuserbyid function");
    }
  });
}

exports.validateUser = async function (id, password) {
  const user = await getUserByEmail(id, true);
  const authenticated = user && await bcrypt.compare(password, user.password);
  return authenticated;
};

exports.isAdmin = async function (id, includePassword = false) {
  return new Promise(async (resolve, reject) => {
    try{
      mysqlPool.query('SELECT COUNT(id) as count FROM users WHERE (id = ? AND admin = 1)', 
          [ id ], (err, results) => {
      if (err) {
        console.log("UserID not found");
        reject(false);
      } else {
          resolve({
            id: results[0].count,
          });
      }
      });
    }
    catch (err) {
      console.log("Error in getuserbyid function");
    }
  });
}