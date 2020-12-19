const router = require("express").Router();
let Tweet = require("../models/tweet.model");
let User = require("../models/user.model");

var xss = require('xss');
var mongoSanitize = require('express-mongo-sanitize');

var ObjectID = require('mongodb').ObjectID;



//Likes a post as a certain user
router.route("/like").post((req, res) => {

    const cleanTweetUUID = mongoSanitize.sanitize(xss(req.body.tweetUUID));
    const cleanUserID = mongoSanitize.sanitize(xss(req.body.userID));

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

    const cleanTweetUUID = mongoSanitize.sanitize(xss(req.body.tweetUUID));
    const cleanUserID = mongoSanitize.sanitize(xss(req.body.userID));

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

    const cleanUserID = mongoSanitize.sanitize(xss(req.query.userID));
    const cleanTweetUUID = mongoSanitize.sanitize(xss(req.query.tweetUUID));

    Tweet.find({ "likedBy.userUUID": cleanUserID, _id: (new ObjectID(cleanTweetUUID)) })
        .then((like) => res.json(like.length))
        .catch((err) => res.status(400).json("Error: " + err));
})


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

    const cleanUserID = mongoSanitize.sanitize(xss(req.query._id));

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
