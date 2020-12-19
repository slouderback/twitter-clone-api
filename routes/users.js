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



const hashPassword = (pwd) => {
  const hash = crypto.createHash('sha256');

  pwd = hash.update(pwd).digest('hex');
  hash.end();

  return pwd;

}




router.route('/add').post((req, res) => {


  const cleanUserName = mongoSanitize.sanitize(xss(req.body.username));
  const cleanPassword = mongoSanitize.sanitize(xss(req.body.password));


  const newUser = new User({ username: cleanUserName, password: hashPassword(cleanPassword) });

  // const newUser = new User({username});

  newUser.save()
    .then(() => res.json('User added!'))
    .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router