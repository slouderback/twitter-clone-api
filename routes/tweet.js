const router = require("express").Router();
let Tweet = require("../models/tweet.model");
let User = require("../models/user.model");

var xss = require('xss');
var ObjectID = require('mongodb').ObjectID;



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

  var cleanUserID = xss(req.query.userID);


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

  const cleanTweetUUID = xss(req.query.tweetUUID);


  Tweet.find({ _id: cleanTweetUUID })
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
router.route("/addRetweetWithComment").post((req, res) => {

  const cleanUserUUID = xss(req.body.userID);
  const cleanTweetUUID = xss(req.body.tweetUUID);
  const cleanTweetBody = xss(req.body.tweetBody);

  const retweetUserIDObject = (new ObjectID(cleanUserUUID));
  const tweetIDObject = (new ObjectID(cleanTweetUUID));


  const retweetObject = { userID: cleanUserUUID, tweetBody: cleanTweetBody, numOfLikes: 0, numOfRetweetsWithComment: 0, numOfRetweetsWithNoComment: 0 };

  const newRetweet = new Tweet(retweetObject);

  newRetweet
    .save()
    .then(() => {
      User.update(
        { _id: retweetUserIDObject }, //arguments object
        { $push: { retweets: { tweetUUID: newRetweet._id } } }
      ).then(() => {

        Tweet.update(
          { _id: tweetIDObject },
          { $push: { retweetedWithComment: { tweetUUID: newRetweet._id, userUUID: cleanUserUUID } }, $inc: { numOfRetweetsWithComment: 1 } }
        ).then(() => {

          res.json("Retweet documented!");
        }).catch((err) => res.status(400).json("Error: " + err)); //TODO: if this fails, remove tweet from db and from user

      }).catch((err) => res.status(400).json("Error: " + err)); //TODO: if this fails, remove new tweet from tweets table

    })
    .catch((err) => res.status(400).json("Error: " + err));
})



/**
 * Returns whether a user has retweeted a tweet yet
 * 
 * Used for checking whether the frontend retweet component is shown as activated or not
 */
router.route("/isRetweeted").get((req, res) => {

  const cleanTweetUUID = xss(req.query.tweetUUID);
  const cleanUserID = xss(req.query.userID);

  Tweet.find({ _id: (new ObjectID(cleanTweetUUID)), "retweetedNoComment.userUUID": cleanUserID })
    .then((tweet) => {

      //if returned array of objects is empty; edge case to skip searching if we retweeted
      if (tweet.length == 0) {
        Tweet.find({ _id: (new ObjectID(cleanTweetUUID)), "retweetedWithComment.userUUID": cleanUserID })
          .then((tweet) => {
            if (tweet.length != 0) { //if retweet found for this tweet by this user, then return true, is retweeted
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
  const cleanTweetUUID = xss(req.body.tweetUUID);
  const cleanUserID = xss(req.body.userID);


  Tweet.find({ _id: (new ObjectID(cleanTweetUUID)), "retweetedNoComment.userUUID": cleanUserID })
    .then((retweet) => {

      //handles if not already retweeted with no comment
      if (retweet.length == 0) {


        //where a user with inputted userID, push the tweet of tweetUUID into their retweets
        User.update(
          { _id: (new ObjectID(cleanUserID)) }, //arguments object
          { $push: { retweets: { tweetUUID: cleanTweetUUID } } }
        ).then(() => {

          //if push succeeds, we update Tweet document where id is of said retweeted tweet with the following
          //retweetedNoComment gains a new array entry of the user who retweeted
          //numofRetweetsWithNoComment increments by 1
          Tweet.update(
            { _id: (new ObjectID(cleanTweetUUID)) },
            { $push: { retweetedNoComment: { userUUID: (new ObjectID(cleanUserID)) } }, $inc: { numOfRetweetsWithNoComment: 1 } }
          ).then(() => {

            res.json("Retweet documented!");
          }).catch((err) => res.status(400).json("Error: " + err)); //TODO: if this fails, remove retweet from tweet stats

        }).catch((err) => res.status(400).json("Error: " + err)); //TODO: if this fails, remove retweet from user


      } else { //if already retweeted with no comment, pulls the retweet from the user's retweets arr and from the tweet's retweet arr


        User.update(
          { _id: (new ObjectID(cleanUserID)) }, //arguments object
          { $pull: { retweets: { tweetUUID: cleanTweetUUID } } }
        ).then(() => {

          Tweet.update(
            { _id: (new ObjectID(cleanTweetUUID)) },
            { $pull: { retweetedNoComment: { userUUID: (new ObjectID(cleanUserID)) } }, $inc: { numOfRetweetsWithNoComment: -1 } }
          ).then(() => {

            res.json("Retweet removed!");
          }).catch((err) => res.status(400).json("Error: " + err));

        }).catch((err) => res.status(400).json("Error: " + err));


      }
    })
    .catch((err) => res.status(400).json("Error: " + err));

})


//Likes a post as a certain user
router.route("/like").post((req, res) => {

  const cleanTweetUUID = xss(req.body.tweetUUID);
  const cleanUserID = xss(req.body.userID);

  User.update(
    { _id: (new ObjectID(cleanUserID)) },
    { $push: { likedTweets: { tweetUUID: cleanTweetUUID, date: new Date() } } }
  ).then(() => {

    Tweet.update(
      { _id: (new ObjectID(cleanTweetUUID)) },
      { $push: { likedBy: { userUUID: cleanUserID } }, $inc: { numOfLikes: 1 } }
    ).then(() => res.json("Tweet updated likes"))
      .catch((err) => res.status(400).json("Error: " + err));
  })
    .catch((err) => res.status(400).json("Error: " + err));

})


router.route("/unlike").post((req, res) => {

  const cleanTweetUUID = xss(req.body.tweetUUID);
  const cleanUserID = xss(req.body.userID);

  User.update(
    { _id: (new ObjectID(cleanUserID)) },
    { $pull: { likedTweets: { tweetUUID: cleanTweetUUID } } }
  ).then(() => {

    Tweet.update(
      { _id: (new ObjectID(cleanTweetUUID)) },
      { $pull: { likedBy: { userUUID: cleanUserID } }, $inc: { numOfLikes: -1 } }
    ).then(() => res.json("Tweet updated likes"))
      .catch((err) => res.status(400).json("Error: " + err));
  })
    .catch((err) => res.status(400).json("Error: " + err));

})


/**
 * Takes in a userID and a tweetID and returns whether the user has liked this specific tweet
 * 
 * Used for showing if a tweet's like button is red or not
 */
router.route("/isLiked").get((req, res) => {

  const cleanUserID = xss(req.query.userID);
  const cleanTweetUUID = xss(req.query.tweetUUID);

  Tweet.find({ "likedBy.userUUID": cleanUserID, _id: (new ObjectID(cleanTweetUUID)) })
    .then((like) => res.json(like.length))
    .catch((err) => res.status(400).json("Error: " + err));
})


/**
 * Makes new tweet, and auto adds it to the user who made it 
 */

router.route("/add").post((req, res) => {

  const cleanUserID = xss(req.body.userID);
  const cleanTweetBody = xss(req.body.tweetBody);


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


/**
 * Returns difference of two dates A and B, where return val is positive if b is more recent than a. 
 * @param {Date} a 
 * @param {Date} b 
 */
function dateSort(a, b) {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

/**
 * Takes in a userID and returns all the tweets they've liked
 */

router.route('/getLikes').get((req, res) => {

  const cleanUserID = xss(req.query._id);

  User.find({ _id: new ObjectID(cleanUserID) }).then((user) => {
    if (!user[0].likedTweets) res.json("user doesnt exist");
    likes = user[0].likedTweets.sort(dateSort);

    var tweetIDs = [];
    for (var i = 0; i < likes.length; i++) {
      if (likes[i].date) tweetIDs.push(likes[i].tweetUUID);
    }

    Tweet.find({ _id: { $in: tweetIDs } }, "userID tweetBody numOfLikes numOfRetweetsWithComment numOfRetweetsWithNoComment createdAt ").then((tweets) => {
      res.json(tweets);
    }).catch((err) => res.status(400).json("Error: " + err))
  }).catch((err) => res.status(400).json("Error: " + err))
})




module.exports = router;
