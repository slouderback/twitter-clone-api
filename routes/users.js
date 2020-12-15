const router = require('express').Router();
const crypto = require('crypto');


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

  req.body.password = hashPassword(req.body.password);

  const newUser = new User(req.body);

  // const newUser = new User({username});

  newUser.save()
    .then(() => res.json('User added!'))
    .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router