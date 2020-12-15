const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema(
	{
		username: {
			type: String,
			required: true, //username here encompasses email, username, and phonenumber. 
			unique: true,
			trim: true,
			minlength: 3,
		},
		password: { type: String, required: true },
		birthdate: { type: String, required: true }, //can store it as a string with delimiters for one query access
		name: { type: String, required: true }, // screen name

		tweetsMade: [{
			tweetUUID: String
		}], //array of tweetUUIDs since we want all the tweets a use has made
		retweets: [{
			tweetUUID: String
		}], //same as tweetsMade but only for retweets. Retweets ARE TWEETS but sometimes content-less
		draftedTweets: [{
			content: String,
			dateDrafted: { type: Date }
		}],

		likedTweets: [{
			tweetUUID: String,
			date: { type: Date }
		}],

		usersFollowing: [
			{
				userUUID: String,
				date: { type: Date },
				isMuted: { type: Boolean }, //muted users diff field
				notificationsOn: { type: Boolean }
			}],

		followedByUsers: [{
			userUUID: String,
			date: { type: Date }
		}],

		blockedUsers: [{
			userUUID: String,
			date: { type: Date }
		}],

		bookmarkedTweets: [{
			tweetUUID: String,
			date: { type: Date }
		}],

		profilePhotoUrl: String,
		coverPhotoUrl: String,
		pinnedTweet: { tweetUUID: String },
		//need to store messaging data but idk how to do that just yet

	},
	{
		timestamps: true,
	}
);

const User = mongoose.model("User", userSchema);

module.exports = User;
