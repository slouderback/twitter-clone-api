const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const tweetSchema = new Schema(
  {
    userID: { type: String, required: true },
    // date: { type: Date, required: true },
    tweetBody: { type: String, required: false },

    likedBy: [{ userUUID: String, date: { type: Date } }], //storing likes would be using an array of jsons. Need date for showing liked tweets
    numOfLikes: Number,

    //this may not be the best way to do this. Some questions are: how do we store likes of the retweet? Perhaps we make the retweet 
    //a tweet in and of itself and store it with the value 'retweet'; can also have value 'comment' or 'tweet' and shit like that?
    //Perhaps we store only uuid and date here and then in the user's model, we store tweetsRetweeted and that holds a json of a retweet and
    //the likes and comments it got? 
    retweetedNoComment: [{ userUUID: String, date: { type: Date } }], //holds who retweeted, and the date it was retweeted
    numOfRetweetsWithNoComment: Number,

    retweetedWithComment: [{ tweetUUID: String, userUUID: String }],
    numOfRetweetsWithComment: Number,

    sharedBy: [{ userUUID: String, Date: { type: Date }, sharedThrough: String }], //sharedThrough holds whether it was the 'dm' or 'added to bookmarks' or 'copy link' options
    images: [
      {
        type: String,
        required: false,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Tweet = mongoose.model("Tweet", tweetSchema);

module.exports = Tweet;
