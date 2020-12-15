const router = require("express").Router();
let Tweet = require("../models/tweet.model");
let User = require("../models/user.model");

router.route("/getUserTweets").get((req, res) => {



  Tweet.find(req.query)
    .then((tweets) => res.json(tweets))
    .catch((err) => res.status(400).json("Error: " + err));
});


/**
 * How to add data to array fields
 * 
 * Tweet.update(
    { _id: user object id }, 
    { $push: { array: array data } },
    done
);
 */

/**
 * Makes new tweet, and auto adds it to the user who made it 
 */

router.route("/add").post((req, res) => {

  const newTweet = new Tweet(req.body);

  newTweet
    .save()
    .then(() => {
      res.json("Tweet added!");

      //Add to the user who made tweet
      User.update(
        { _id: newTweet.userID },
        { $push: { tweetsMade: newTweet._id } }
      ).then(() => {
        res.json("Tweet added to user");
      })
        .catch((err) => res.status(400).json("Error: " + err));



    })
    .catch((err) => res.status(400).json("Error: " + err));



});

module.exports = router;
