const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const tweetSchema = new Schema({
  userID: { type: String, required: true },
  // date: { type: Date, required: true },
  tweetBody: { type: String, required: true },
}, {
  timestamps: true,
});

const Tweet = mongoose.model('Tweet', tweetSchema);

module.exports = Tweet;