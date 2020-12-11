const router = require("express").Router();
let Tweet = require("../models/tweet.model");

router.route("/").get((req, res) => {
  Tweet.find()
    .then((tweets) => res.json(tweets))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/add").post((req, res) => {
  const userID = req.body.userID;
  const userName = req.body.userName;
  const userHandle = req.body.userHandle;
  // const date = Date.parse(req.body.date);
  const tweetBody = req.body.tweetBody;
  const images = req.body.images;

  const newTweet = new Tweet({
    userID,
    userName,
    userHandle,
    tweetBody,
    images,
  });

  newTweet
    .save()
    .then(() => res.json("Tweet added!"))
    .catch((err) => res.status(400).json("Error: " + err));
});

module.exports = router;
