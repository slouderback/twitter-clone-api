const router = require('express').Router();
let Tweet = require('../models/tweet.tweet');

router.route('/').get((req, res) => {
  Tweet.find()
    .then(tweets => res.json(tweets))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/add').post((req, res) => {
  const userID = req.body.userID;
  const date = Date.parse(req.body.date);
  const text = req.body.text;

  const newTweet = new Tweet({
    userID,
    date,
    text,
  });

  newExercise.save()
  .then(() => res.json('Exercise added!'))
  .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router;