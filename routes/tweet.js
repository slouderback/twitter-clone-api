const router = require("express").Router();
let Tweet = require("../models/tweet.model");
let User = require("../models/user.model");
var ObjectID = require('mongodb').ObjectID;

router.route("/getUserTweets").get((req, res) => {



  Tweet.find(req.query).sort('-createdAt')
    .then((tweets) => res.json(tweets))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.route("/getTweet").get((req, res) => {

  Tweet.find({ _id: req.query.tweetUUID })
    .then((tweets) => res.json(tweets))
    .catch((err) => res.status(400).json("Error: " + err));
});




/**
 * Called when making a retweet
 * 
 * First creates the retweet as a normal tweet. Then, if successfully made, updates
 * the user who made the retweet with the fact that they made a retweet
 * 
 * Then, if this succeeds, updates the retweeted tweet with the id of the new retweet
 * 
 * 
 * Nested because it needs to be atomic.
 * 
 * 
 * Retweet with comment only
 */
router.route("/addRetweet").post((req, res) => {


  const rt = { userID: req.body.userID, tweetBody: req.body.tweetBody, numOfLikes: 0, numOfRetweetsWithComment: 0, numOfRetweetsWithNoComment: 0 };


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
          { $push: { retweetedWithComment: { tweetUUID: newRetweet._id, userUUID: newRetweet.userID } }, $inc: { numOfRetweetsWithComment: 1 } }
        ).then(() => {

          res.json("Retweet documented!");
        }).catch((err) => res.status(400).json("Error: " + err)); //TODO: if this fails, remove tweet from db and from user

      }).catch((err) => res.status(400).json("Error: " + err)); //TODO: if this fails, remove new tweet from tweets table

    })
    .catch((err) => res.status(400).json("Error: " + err));
})



/**
 * Returns whether a user has retweeted a tweet yet
 */
router.route("/isRetweeted").get((req, res) => {

  var noComment = false;
  Tweet.find({ _id: (new ObjectID(req.query.tweetUUID)), "retweetedNoComment.userUUID": req.query.userID })
    .then((tweet) => {
      if (tweet.length == 0) {
        Tweet.find({ _id: (new ObjectID(req.query.tweetUUID)), "retweetedWithComment.userUUID": req.query.userID })
          .then((tweet) => {
            if (tweet.length != 0) {
              res.json("true");

            } else {
              res.json("false");

            }

          }).catch((error) => res.status(400).json("Error: " + error));

      } else {

        res.json("true");

      }

    }).catch((error) => res.status(400).json("Error: " + error));
})


router.route("/addRetweetWithNoComment").post((req, res) => {

  //check if retweeted alrdy, if not, retweet, if so, unretweet
  //first add userid to retweet retweetswithnocomment
  //then increment tweet retweetswithnocomment

  //then add tweetid to user retweets

  const retweetUserID = (new ObjectID(req.body.userID));
  const tweetUUID = req.body.tweetUUID;

  Tweet.find({ _id: (new ObjectID(tweetUUID)), "retweetedNoComment.userUUID": req.body.userID })
    .then((retweet) => {

      if (retweet.length == 0) {


        User.update(
          { _id: retweetUserID }, //arguments object
          { $push: { retweets: { tweetUUID: tweetUUID } } }
        ).then(() => {

          Tweet.update(
            { _id: (new ObjectID(tweetUUID)) },
            { $push: { retweetedNoComment: { userUUID: retweetUserID } }, $inc: { numOfRetweetsWithNoComment: 1 } }
          ).then(() => {

            res.json("Retweet documented!");
          }).catch((err) => res.status(400).json("Error: " + err)); //TODO: if this fails, remove retweet from tweet stats

        }).catch((err) => res.status(400).json("Error: " + err)); //TODO: if this fails, remove retweet from user






      } else {


        User.update(
          { _id: retweetUserID }, //arguments object
          { $pull: { retweets: { tweetUUID: tweetUUID } } }
        ).then(() => {

          Tweet.update(
            { _id: (new ObjectID(tweetUUID)) },
            { $pull: { retweetedNoComment: { userUUID: retweetUserID } }, $inc: { numOfRetweetsWithNoComment: -1 } }
          ).then(() => {

            res.json("Retweet removed!");
          }).catch((err) => res.status(400).json("Error: " + err));

        }).catch((err) => res.status(400).json("Error: " + err));


      }


    })
    .catch((err) => res.status(400).json("Error: " + err));








})


router.route("/like").post((req, res) => {

  const inputTweetUUID = req.body.tweetUUID;

  const userUUID = req.body.userID;

  User.update(
    { _id: (new ObjectID(userUUID)) },
    { $push: { likedTweets: { tweetUUID: inputTweetUUID } } }
  ).then(() => {

    Tweet.update(
      { _id: (new ObjectID(inputTweetUUID)) },
      { $push: { likedBy: { userUUID: userUUID } }, $inc: { numOfLikes: 1 } }
    ).then(() => res.json("Tweet updated likes"))
      .catch((err) => res.status(400).json("Error: " + err));
  })
    .catch((err) => res.status(400).json("Error: " + err));

})


router.route("/unlike").post((req, res) => {

  const inputTweetUUID = req.body.tweetUUID;

  const userUUID = req.body.userID;

  User.update(
    { _id: (new ObjectID(userUUID)) },
    { $pull: { likedTweets: { tweetUUID: inputTweetUUID } } }
  ).then(() => {

    Tweet.update(
      { _id: (new ObjectID(inputTweetUUID)) },
      { $pull: { likedBy: { userUUID: userUUID } }, $inc: { numOfLikes: -1 } }
    ).then(() => res.json("Tweet updated likes"))
      .catch((err) => res.status(400).json("Error: " + err));
  })
    .catch((err) => res.status(400).json("Error: " + err));

})


router.route("/isLiked").get((req, res) => {



  Tweet.find({ "likedBy.userUUID": req.query.userID, _id: (new ObjectID(req.query.tweetUUID)) })
    .then((like) => res.json(like.length))
    .catch((err) => res.status(400).json("Error: " + err));
})




/**
 * Makes new tweet, and auto adds it to the user who made it 
 */

router.route("/add").post((req, res) => {

  const tweet = { userID: req.body.userID, tweetBody: req.body.tweetBody, numOfLikes: 0, numOfRetweetsWithComment: 0, numOfRetweetsWithNoComment: 0 };


  const newTweet = new Tweet(tweet);

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
