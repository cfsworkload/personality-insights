// Licensed under the Apache License. See footer for details.
var
  express = require('express'),
  app = express(),
  cfenv = require('cfenv');

require('./config/express')(app);

// error-handler settings
//require('./config/error-handler')(app);

//---Cloudant Database Creation-------------------------------------------------

var cloudantDB;
var cloudant;
var cloudantCredentials = {
	dbName : 'twitter_db'
};

//Get the port and host name from the environment variables
var port = (process.env.VCAP_APP_PORT || 3000);
var host = (process.env.VCAP_APP_HOST || '0.0.0.0');

//setup cloudant db
function initCloudantDBConnection() {
	if(process.env.VCAP_SERVICES) {
		var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
		if(vcapServices.cloudantNoSQLDB) {
			cloudantCredentials.host = vcapServices.cloudantNoSQLDB[0].credentials.host;
			cloudantCredentials.port = vcapServices.cloudantNoSQLDB[0].credentials.port;
			cloudantCredentials.user = vcapServices.cloudantNoSQLDB[0].credentials.username;
			cloudantCredentials.password = vcapServices.cloudantNoSQLDB[0].credentials.password;
			cloudantCredentials.url = vcapServices.cloudantNoSQLDB[0].credentials.url;
		}
		console.log('VCAP Services: '+JSON.stringify(process.env.VCAP_SERVICES));
	}
    else {
    	console.log("Unable to find Cloudant credentials");
    }

	cloudant = require('cloudant')(cloudantCredentials.url);
	
	//check if DB exists if not create
	cloudant.db.create(cloudantCredentials.dbName, function (err, res) {
		if (err) { console.log('could not create db'/*, err*/); }
    });
	cloudantDB = cloudant.use(cloudantCredentials.dbName);
}

initCloudantDBConnection();

function insertTweetIntoDB(tweet) {
	//var tweet = JSON.parse(jsonTweet);
	
	// msgId					message.id
	// msgType					message.verb
	// msgPostedTime			message.postedTime
	// msgBody					message.body
	// msgFavoritesCount		message.favoritesCount
	// msgHashtags				message.twitter_entities.hashtags
	// 							message.gnip.profileLocations.geo.type
	// 							message.gnip.profileLocations.geo.coordinates
	// smaAuthorCountry			cde.author.location.country
	// smaAuthorState			cde.author.location.state
	// smaAuthorCity			cde.author.location.city
	// smaAuthorGender			cde.author.gender
	// smaSentiment				cde.content.sentiment.polarity
	// smaIsParent				cde.author.parenthood.isParent
	// smaIsMarried				cde.author.maritalStatus.isMarried
	// userId					message.actor.id
	// userDisplayName			message.actor.displayName
	// userPreferredUsername	message.actor.preferredUsername
	// 							message.actor.links.href
	// 							message.actor.location.displayName
	// 							message.actor.utcOffset
	// userLanguage				message.actor.languages
	// userFollowersCount		message.actor.followersCount
	// userFriendsCount			message.actor.friendsCount
	// userListedCount			message.actor.listedCount
	// userStatusesCount		message.actor.StatusesCount
	//db.insert({"Topic": packet.topic, "Message": packet.payload.toString("utf8")}, function(err, body) {
	//queryDB("SELECT MSGID FROM TWITTER_DB WHERE MSG ID = " + tweet.message.id);
	cloudantDB.insert({"msgId": tweet.message.id,
			"msgType": tweet.message.verb,
			"msgPostedTime": tweet.message.postedTime,
			"msgBody": tweet.message.body,
			"msgFavoritesCount": tweet.message.favoritesCount,
			"smaAuthorCountry": tweet.cde.author.location.country,
			"smaAuthorState": tweet.cde.author.location.state,
			"smaAuthorCity": tweet.cde.author.location.city,
			"smaAuthorGender": tweet.cde.author.gender,
			"smaSentiment": tweet.cde.content.sentiment.polarity,
			"smaIsParent": tweet.cde.author.parenthood.isParent,
			"smaIsMarried": tweet.cde.author.maritalStatus.isMarried,
			"userId": tweet.message.actor.id,
			"userDisplayName": tweet.message.actor.displayName,
			"userPreferredUsername": tweet.message.actor.preferredUsername,
			"userLanguage": tweet.message.actor.languages,
			"userFollowersCount": tweet.message.actor.followersCount,
			"userFriendsCount": tweet.message.actor.friendsCount,
			"userListedCount": tweet.message.actor.listedCount,
			"userStatusesCount": tweet.message.actor.StatusesCount
			}, function(err, body) {
 				if (!err)
    				console.log(body);
    			else
    				console.log("Error inserting data into cloudant", err);
			}
	);
}

//--DashDB Creation-------------------------------------------------------------

var dashDBcredentials = {};
var dashDB;

function initDashDBConnection() {
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

	dashDB = require('ibm_db');
}

initDashDBConnection();

function queryDB(query, result) {
	console.log("attempting to query dashDB with " + query);
	dashDB.open(dashDBcredentials.dsn, function(err, conn) {
		if(err) {
			console.log("Unable to connect to dashDB");
			console.error("Error: ", err);
			return;
		} else {
			conn.query(query, function(err, rows) {
				if(err) {
					console.log("Unable to query dashDB");
					console.error("Error: ", err);
					return;
				} else {
					var rowText = JSON.parse(JSON.stringify(rows));
					var text = "";
					for(var i in rowText) {
						text += rowText[i].MSGBODY + "\n\n";
					}
					conn.close(function() {
						console.log("Connection closed successfully.");
					});
					
					console.log("queryDB text: " + text);
					result(text);
				}
			});
		}
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

//---Deployment Tracker---------------------------------------------------------
require("cf-deployment-tracker-client").track();

// load local VCAP configuration
var vcapLocal = null
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

var twitterCreds = appEnv.getServiceCreds("insights-search-twitter");
var twitter = require('./lib/twitter.js')(twitterCreds.url);

app.get("/api/1/messages/count", function (req, res) {
  console.log("Counting with", req.query.q);
  twitter.count(req.query.q, function (error, body) {
    if (error) {
      res.sendStatus(500);
    }
    
    console.log(body);
    
    res.send(body);
  });
});

app.get("/api/1/messages/search", function (req, res) {
  console.log("Searching with", req.query.q);
  // limit to the first 20 tweets
  var numTweets = 20;// default is 100, max is 500
  var tweetIndex = 0;// e.g. to get next 20, set this to 20, then 40, etc.
  twitter.search(req.query.q, numTweets, tweetIndex, function (error, body) {
    if (error) {
      res.sendStatus(500);
    }
    
//    console.log(body);
//    var jsonStuff = JSON.parse(body);
//    console.log("parsed successfully");
//    console.log(jsonStuff.tweets);
	console.log(JSON.stringify(body));
	var tweets = JSON.parse(JSON.stringify(body.tweets));
	for(var i in tweets) {
		 //console.log(tweets[i]);
		 console.log("attempting to insert into DB...");
		 console.log(JSON.stringify(tweets[i]));
		 insertTweetIntoDB(tweets[i]);
	}
    
    res.send(body);
  });
});

app.get("/api/1/tracks", function (req, res) {
  console.log("Retrieving tracks");
  twitter.getTracks(function (error, body) {
    if (error) {
      res.sendStatus(500);
    }
    res.send(body);
  });
});

app.get("/api/1/tracks/:id/messages/count", function (req, res) {
  console.log("Counting track", req.params.id, "with", req.query.q);
  twitter.countTrack(req.params.id, req.query.q, function (error, body) {
    if (error) {
      res.sendStatus(500);
    }
    res.send(body);
  });
});

app.get("/api/1/tracks/:id/messages/search", function (req, res) {
  console.log("Searching track", req.params.id, "with", req.query.q);
  // limit to the first 20 tweets
  var numTweets = 20;// default is 100, max is 500
  var tweetIndex = 0;// e.g. to get next 20, set this to 20, then 40, etc.
  twitter.searchTrack(req.params.id, req.query.q, numTweets, tweetIndex, function (error, body) {
    if (error) {
      res.sendStatus(500);
    }
    res.send(body);
  });
});

app.get("specialSelect", function(req, res) {
	var result;
	queryDB("SELECT MSGBODY FROM TWITTER_DB WHERE USERPREFERREDUSERNAME = 'BarackObama'", result);
	res.send(result);
});

app.get("/select", function(req, res) {
	dashDB.open(dashDBcredentials.dsn, function(err, conn) {
		if(err) {
			console.log("Unable to connect to dashDB");
			console.error("Error: ", err);
			return;
		} else {
			var query = "SELECT MSGBODY FROM TWITTER_DB WHERE USERPREFERREDUSERNAME = 'BarackObama'";
			conn.query(query, function(err, rows) {
				if(err) {
					console.log("Unable to query dashDB");
					console.error("Error: ", err);
					return;
				} else {
					var rowText = JSON.parse(JSON.stringify(rows));
					var text = "";
					for(var i in rowText) {
						text += rowText[i].MSGBODY + "\n\n";
					}
					res.send(text);
					conn.close(function() {
						console.log("Connection closed successfully.");
					});
				}
			});
		}
	});
});

app.post('/personality', function(req, res, next) {
//app.get('/personality', function(req, res) {
  //var parameters = extend(req.body, { acceptLanguage : i18n.lng() });

  console.log("finding personality insights...");
  //console.log(req);
  //console.log("here's the body...");
  //console.log(req.body);

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

//------------------------------------------------------------------------------
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//------------------------------------------------------------------------------
