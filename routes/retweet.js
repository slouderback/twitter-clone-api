const router = require("express").Router();
let Tweet = require("../models/tweet.model");
let User = require("../models/user.model");

var xss = require('xss');
var mongoSanitize = require('express-mongo-sanitize');

var ObjectID = require('mongodb').ObjectID;



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

    const cleanUserUUID = mongoSanitize.sanitize(xss(req.body.userID));
    const cleanTweetUUID = mongoSanitize.sanitize(xss(req.body.tweetUUID));
    const cleanTweetBody = mongoSanitize.sanitize(xss(req.body.tweetBody));

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

    const cleanTweetUUID = mongoSanitize.sanitize(xss(req.query.tweetUUID));
    const cleanUserID = mongoSanitize.sanitize(xss(req.query.userID));

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
    const cleanTweetUUID = mongoSanitize.sanitize(xss(req.body.tweetUUID));
    const cleanUserID = mongoSanitize.sanitize(xss(req.body.userID));


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

module.exports = router;
