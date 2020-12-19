const router = require('express').Router();
const crypto = require('crypto');

var xss = require('xss');
var mongoSanitize = require('express-mongo-sanitize');


let User = require('../models/user.model');

router.route('/').get((req, res) => {
  User.find()
    .then(users => res.json(users))
    .catch(err => res.status(400).json('Error: ' + err));
});



//hashes the password with the salt added to the beginning
const hashPassword = (salt, pwd) => {
  const hash = crypto.createHash('sha256');

  pwd = hash.update(salt + pwd).digest('hex');
  hash.end();

  return pwd;

}




router.route('/add').post((req, res) => {


  const cleanUserName = mongoSanitize.sanitize(xss(req.body.username));
  const cleanPassword = mongoSanitize.sanitize(xss(req.body.password));
  const cleanBirthdate = mongoSanitize.sanitize(xss(req.body.birthdate));
  const cleanName = mongoSanitize.sanitize(xss(req.body.name));
  const cleanHandle = mongoSanitize.sanitize(xss(req.body.handle));
  //randomly generated salt
  const salt = crypto.randomBytes(16).toString('hex');


  const newUser = new User({
    username: cleanUserName,
    password: hashPassword(salt, cleanPassword), salt: salt,
    birthdate: cleanBirthdate,
    name: cleanName,
    handle: cleanHandle
  });


  newUser.save()
    .then(() => res.json('User added!'))
    .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router