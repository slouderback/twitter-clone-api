const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const tweetSchema = new Schema(
  {
    userID: { type: String, required: true },
    userName: { type: String, required: true },
    userHandle: { type: String, required: true },
    // date: { type: Date, required: true },
    tweetBody: { type: String, required: true },
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
