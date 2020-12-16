const router = require("express").Router();
let Tweet = require("../models/tweet.model");
let User = require("../models/user.model");
var ObjectID = require('mongodb').ObjectID;

router.route("/getUserTweets").get((req, res) => {



  Tweet.find(req.query).sort('-createdAt')
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

router.route("/addRetweet").post((req, res) => {

  if (req.body.tweetBody == "") return false;

  const rt = { userID: req.body.userID, tweetBody: req.body.tweetBody };

  const retweetUserID = (new ObjectID(req.body.userID));
  const tweetUUID = (new ObjectID(req.body.tweetUUID));

  const newRetweet = new Tweet(rt);




  newRetweet
    .save()
    .then(() => {


      User.update(
        { _id: retweetUserID }, //arguments object
        { $push: { retweets: { tweetUUID: newRetweet._id } } }
      ).then(() => {

        Tweet.update(
          { _id: tweetUUID },
          { $push: { retweetedWithComment: { tweetUUID: newRetweet._id, userUUID: newRetweet.userID } } }
        ).then(() => {

          res.json("Retweet documented!");
        }).catch((err) => res.status(400).json("Error: " + err));

      }).catch((err) => res.status(400).json("Error: " + err));

    })
    .catch((err) => res.status(400).json("Error: " + err));



})










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
