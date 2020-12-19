const router = require("express").Router();

let Tweet = require("../models/tweet.model");
let User = require("../models/user.model");

let xss = require('xss');
let mongoSanitize = require('express-mongo-sanitize');




/**
 * GET handler which takes in a query with a userID and returns all the tweets 
 * that that user had made
 * 
 * For GET request, req.query
 * For POST request,  req.body
 * 
 * passing in req.query = passing in {userID : "userid", ..}
 * 
 * {params}: userID json object
 */
router.route("/getUserTweets").get((req, res) => {

  var cleanUserID = mongoSanitize.sanitize(xss(req.query.userID));


  //Parms are userID => {userID: userID}
  Tweet.find({ userID: cleanUserID }).sort('-createdAt') //.sort('-createAt) = the '-' means descending
    .then((tweet) => res.json(tweet))
    .catch((err) => res.status(400).json("Error: " + err));
});



/**
 * Takes in a tweet object ID and returns the tweet
 * 
 * {params} : { _id : tweetUUID }
 */
router.route("/getTweet").get((req, res) => {

  const cleanTweetUUID = mongoSanitize.sanitize(xss(req.query.tweetUUID));


  Tweet.find({ _id: cleanTweetUUID })
    .then((tweets) => res.json(tweets))
    .catch((err) => res.status(400).json("Error: " + err));
});




/**
 * Makes new tweet, and auto adds it to the user who made it 
 */

router.route("/add").post((req, res) => {

  const cleanUserID = mongoSanitize.sanitize(xss(req.body.userID));
  const cleanTweetBody = mongoSanitize.sanitize(xss(req.body.tweetBody));


  const tweet = { userID: cleanUserID, tweetBody: cleanTweetBody, numOfLikes: 0, numOfRetweetsWithComment: 0, numOfRetweetsWithNoComment: 0 };


  const newTweet = new Tweet(tweet);

  newTweet
    .save()
    .then(() => {

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
