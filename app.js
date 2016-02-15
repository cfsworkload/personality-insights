// Copyright (c) 2016 IBM Corp. All rights reserved.
// Use of this source code is governed by the Apache License,
// Version 2.0, a copy of which can be found in the LICENSE file.
var
  express = require('express'),
  app = express(),
  cfenv = require('cfenv');

require('./config/express')(app);

// error-handler settings
//require('./config/error-handler')(app);

//--DashDB Creation-------------------------------------------------------------

var dashDBcredentials = {};
var db;

function initDBConnection() {
	if(process.env.VCAP_SERVICES) {
		var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
		if(vcapServices.dashDB) {
			dashDBcredentials.dsn = vcapServices.dashDB[0].credentials.dsn;
			console.log("dashDB dsn: " + dashDBcredentials.dsn);
		}
	}
	else {
		console.log("Unable to find dashDB credentials");
	}

	db = require('ibm_db');

	db.open(dashDBcredentials.dsn, function(err,conn) {
		if(err) {
			console.log("Unable to connect to dashDB");
			console.error("Error: ", err);
			return;
		}

		var createTableStatement = 'CREATE TABLE "TWITTER_DB" (' +
				'"MESSAGE_ID" VARCHAR(256) NOT NULL, ' +
				'"MESSAGE_BODY" VARCHAR(1024), ' +
				'"MESSAGE_FAVORITES_COUNT" BIGINT, ' +
				'"MESSAGE_POSTED_TIME" VARCHAR(32), ' +
				'"MESSAGE_TYPE" VARCHAR(16), ' +
				'"MESSAGE_SENTIMENT" VARCHAR(16), ' +
				'"AUTHOR_CITY" VARCHAR(64), ' +
				'"AUTHOR_STATE" VARCHAR(64), ' +
				'"AUTHOR_COUNTRY" VARCHAR(64), ' +
				'"AUTHOR_GENDER" VARCHAR(16), ' +
				'"AUTHOR_IS_MARRIED" VARCHAR(16), ' +
				'"AUTHOR_IS_PARENT" VARCHAR(16), ' +
				'"AUTHOR_PREFERRED_USERNAME" VARCHAR(128), ' +
				'"AUTHOR_DISPLAY_NAME" VARCHAR(64), ' +
				'"AUTHOR_FOLLOWER_COUNT" BIGINT, ' +
				'"AUTHOR_FRIEND_COUNT" BIGINT, ' +
				'"AUTHOR_ID" VARCHAR(128), ' +
				'"AUTHOR_LISTED_COUNT" BIGINT, ' +
				'PRIMARY KEY (MESSAGE_ID));';

		console.log("attempting to create table...");
		console.log("create table statement: " + createTableStatement);

		conn.prepare(createTableStatement, function (err, stmt) {
			if (err) {
				//could not prepare for some reason
				console.log(err);
				return conn.closeSync();
			}

			//Bind and Execute the statment asynchronously
			stmt.execute(['something', 42], function (err, result) {
				if( err ) console.log(err);  
				else result.closeSync();

				//Close the connection
				conn.closeSync(function(err) {
					if(err) console.log("Problem disconnecting from dashDB");
					else console.log("Connection closed successfully.");
				});
			});
		});
	});
}

initDBConnection();

function insertTweetIntoDB(data) {
	var tweet = JSON.parse(data);

	// initialize default values
	var defaultText = 'undefined';
	var defaultInt = 0;
	var messageId = defaultText,
		messageBody = defaultText,
		messagePostedTime = defaultText,
		messageType = defaultText,
		messageSentiment = defaultText,
		authorCity = defaultText,
		authorState = defaultText,
		authorCountry = defaultText,
		authorGender = defaultText,
		authorIsMarried = defaultText,
		authorIsParent = defaultText,
		authorPreferredUsername = defaultText,
		authorDisplayName, authorId = defaultText;
	var messageFavoritesCount = defaultInt,
		authorFollowerCount = defaultInt,
		authorFriendCount = defaultInt,
		authorListedCount = defaultInt;

	// it's possible that the JSON won't contain some objects, so we need to check first
	if(tweet.message) {
		var message = JSON.parse(JSON.stringify(tweet.message));
		if(message.id) messageId = message.id;
		if(message.body) {
			var pattern = "'", re = new RegExp(pattern, "g");
			messageBody = message.body.replace(re, "''");
		}
		if(message.postedTime) {
			messagePostedTime = message.postedTime.substring(0, 10) + ' ' + message.postedTime.substring(11,19);
		}
		if(message.verb) messageType = message.verb;
		if(message.favoritesCount) messageFavoritesCount = message.favoritesCount;
		if(message.actor) {
			var actor = JSON.parse(JSON.stringify(message.actor));
			if(actor.preferredUsername) authorPreferredUsername = actor.preferredUsername;
			if(actor.displayName) authorDisplayName = actor.displayName;
			if(actor.followersCount) authorFollowerCount = actor.followersCount;
			if(actor.friendsCount) authorFriendCount = actor.friendsCount;
			if(actor.id) authorId = actor.id;
			if(actor.listedCount) authorListedCount = actor.listedCount;
		}
	}
	if(tweet.cde) {
		var cde = JSON.parse(JSON.stringify(tweet.cde));
		if(cde.content) {
			var content = JSON.parse(JSON.stringify(cde.content));
			if(content.sentiment) {
				var sentiment = JSON.parse(JSON.stringify(content.sentiment));
				if(sentiment.polarity) {
					messageSentiment = sentiment.polarity;
				}
			}
		}
		if(cde.author) {
			var author = JSON.parse(JSON.stringify(cde.author));
			if(author.gender) authorGender = author.gender;
			if(author.maritalStatus) {
				if(author.maritalStatus.isMarried) authorIsMarried = author.maritalStatus.isMarried;
			}
			if(author.parenthood) {
				if(author.parenthood.isParent) authorIsParent = author.parenthood.isParent;
			}
			if(author.location) {
				var location = JSON.parse(JSON.stringify(author.location));
				if(location.city) authorCity = location.city;
				if(location.state) authorState = location.state;
				if(location.country) authorCountry = location.country;
			}
		}
	}

	// check to see if we have the most basic information
	if(messageBody === defaultText || messageId === defaultText) {
		console.log("Unable to extract sufficient information from tweet");
		console.log("tweet data: " + data);
		return;
	}

	db.open(dashDBcredentials.dsn, function(err, conn) {
		if(err) {
			console.log("Unable to connect to dashDB");
			console.error("Error: ", err);
			return;
		}

		var insertStatement = "INSERT INTO TWITTER_DB VALUES ('" +
				messageId + "', '" +
				messageBody + "', " +
				messageFavoritesCount + ", '" +
				messagePostedTime + "', '" +
				messageType + "', '" +
				messageSentiment + "', '" +
				authorCity + "', '" +
				authorState + "', '" +
				authorCountry + "', '" +
				authorGender + "', '" +
				authorIsMarried + "', '" +
				authorIsParent + "', '" +
				authorPreferredUsername + "', '" +
				authorDisplayName + "', " +
				authorFollowerCount + ", " +
				authorFriendCount + ", '" +
				authorId + "', '" +
				authorListedCount + "');";

		console.log("attempting to insert data...");
		console.log("insert statement: " + insertStatement);

		conn.prepare(insertStatement, function (err, stmt) {
			if (err) {
				//could not prepare for some reason
				console.log(err);
				return conn.closeSync();
			}

			//Bind and Execute the statment asynchronously
			stmt.execute(['something', 42], function (err, result) {
				if( err ) console.log(err);  
				else result.closeSync();

				//Close the connection
				conn.closeSync(function(err) {
					if(err) console.log("Problem disconnecting from dashDB");
					else console.log("Connection closed successfully.");
				});
			});
		});
	});
}

//--Watson Personality Insights-------------------------------------------------

var watson = require('watson-developer-cloud');
var extend = require('util')._extend;

var personalityInsightsCredentials;
var personalityInsights;

function initPersonalityInsights() {
	if(process.env.VCAP_SERVICES) {
		var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
		if(vcapServices.personality_insights) {
			personalityInsightsCredentials = extend({version: 'v2'}, vcapServices.personality_insights[0].credentials);
		}
	}
    else {
    	console.log("Unable to find Personality Insights credentials");
    }

	personalityInsights = watson.personality_insights(personalityInsightsCredentials);
}

initPersonalityInsights();

//var i18n = require('i18next');

//i18n settings
//require('./config/i18n')(app);

//---Twitter Service Initialization--------------------------------------------

// load local VCAP configuration
var vcapLocal = null;
try {
  vcapLocal = require("./vcap-local.json");
  console.log("Loaded local VCAP", vcapLocal);
} catch (e) {
  console.error(e);
}

// get the app environment from Cloud Foundry, defaulting to local VCAP
var appEnvOpts = vcapLocal ? {
  vcap: vcapLocal
} : {};
var appEnv = cfenv.getAppEnv(appEnvOpts);

var twitterCreds = appEnv.getServiceCreds("social-media-test-twitter");
var twitter = require('./js/twitter.js')(twitterCreds.url);

// limit to the first 20 tweets
var numTweets = 20;// default is 100, max is 500
var tweetIndex = 0;// e.g. to get next 20, set this to 20, then 40, etc.

//---App----------------------------------------------------------------------

// decahose count
app.get("/api/twitter/messages/count", function (req, res) {
  console.log("Counting with", req.query.q);
  twitter.count(req.query.q, function (error, body) {
    if (error) {
      res.sendStatus(500);
    }
    
    console.log(body);
    
    res.send(body);
  });
});

// decahose search
app.get("/api/twitter/messages/search", function (req, res) {
	console.log("Searching with", req.query.q);
	twitter.search(req.query.q, numTweets, tweetIndex, function (error, body) {
		if (error) {
			res.sendStatus(500);
		}

		var tweets = JSON.parse(JSON.stringify(body.tweets));
		for(var i in tweets) {
			insertTweetIntoDB(JSON.stringify(tweets[i]));
		}

		res.send(body);
	});
});

// tracks
app.get("/api/twitter/tracks", function (req, res) {
	console.log("Retrieving tracks");
	twitter.getTracks(function (error, body) {
		if (error) {
			res.sendStatus(500);
		}
		res.send(body);
	});
});

// powertrack count
app.get("/api/twitter/tracks/:id/messages/count", function (req, res) {
	console.log("Counting track", req.params.id, "with", req.query.q);
	twitter.countTrack(req.params.id, req.query.q, function (error, body) {
		if (error) {
			res.sendStatus(500);
		}
		res.send(body);
	});
});

// powertrack search
app.get("/api/twitter/tracks/:id/messages/search", function (req, res) {
	console.log("Searching track", req.params.id, "with", req.query.q);
	twitter.searchTrack(req.params.id, req.query.q, numTweets, tweetIndex, function (error, body) {
		if (error) {
			res.sendStatus(500);
		}
		
		var tweets = JSON.parse(JSON.stringify(body.tweets));
		for(var i in tweets) {
			insertTweetIntoDB(JSON.stringify(tweets[i]));
		}
		
		res.send(body);
	});
});

app.post('/api/db/tweets', function(req, res) {
	db.open(dashDBcredentials.dsn, function(err, conn) {
		if(err) {
			console.log("Unable to connect to dashDB");
			console.error("Error: ", err);
			return;
		} else {
			var query = "SELECT MESSAGE_BODY FROM TWITTER_DB WHERE AUTHOR_PREFERRED_USERNAME = '" + req.body.name + "';";
			console.log("query statement: " + query);
			conn.query(query, function(err, rows) {
				if(err) {
					console.log("Unable to query dashDB");
					console.error("Error: ", err);
					return;
				} else {
					var rowText = JSON.parse(JSON.stringify(rows));
					var text = "";
					for(var i in rowText) {
						text += rowText[i].MESSAGE_BODY + "\n\n";
					}
					console.log("query result: " + text);
					res.send(text);
					conn.closeSync(function() {
						console.log("Connection closed successfully.");
					});
				}
			});
		}
	});
});

app.post('/api/profile', function(req, res, next) {
	//var parameters = extend(req.body, { acceptLanguage : i18n.lng() });

	console.log("finding personality insights...");

	personalityInsights.profile(req.body, function(err, profile) {
		if (err)
			return next(err);
		else
			return res.json(profile);
	});
});

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// start server on the specified port and binding host
app.listen(appEnv.port, "0.0.0.0", function () {
	// print a message when the server starts listening
	console.log("server starting on " + appEnv.url);
});
