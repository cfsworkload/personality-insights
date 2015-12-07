// Licensed under the Apache License. See footer for details.
var
  express = require('express'),
  app = express(),
  cfenv = require('cfenv');

var db;
var cloudant;
var dbCredentials = {
	dbName : 'twitter_db'
};

//---Database Creation----------------------------------------------------------

//Get the port and host name from the environment variables
var port = (process.env.VCAP_APP_PORT || 3000);
var host = (process.env.VCAP_APP_HOST || '0.0.0.0');

//setup cloudant db
function initDBConnection() {
	if(process.env.VCAP_SERVICES) {
		var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
		if(vcapServices.cloudantNoSQLDB) {
			dbCredentials.host = vcapServices.cloudantNoSQLDB[0].credentials.host;
			dbCredentials.port = vcapServices.cloudantNoSQLDB[0].credentials.port;
			dbCredentials.user = vcapServices.cloudantNoSQLDB[0].credentials.username;
			dbCredentials.password = vcapServices.cloudantNoSQLDB[0].credentials.password;
			dbCredentials.url = vcapServices.cloudantNoSQLDB[0].credentials.url;
		}
		console.log('VCAP Services: '+JSON.stringify(process.env.VCAP_SERVICES));
	}
    else {
    	console.log("Unable to find Cloudant credentials");
		dbCredentials.host = "ffe37731-0505-4683-96a8-87d02a33e03e-bluemix.cloudant.com";
		dbCredentials.port = 443;
		dbCredentials.user = "ffe37731-0505-4683-96a8-87d02a33e03e-bluemix";
		dbCredentials.password = "c7003d0b156d9c4ce856c4e6b4427f3b576c7ea6229235f0369ada1ed47b159c";
		dbCredentials.url = "https://ffe37731-0505-4683-96a8-87d02a33e03e-bluemix:c7003d0b156d9c4ce856c4e6b4427f3b576c7ea6229235f0369ada1ed47b159c@ffe37731-0505-4683-96a8-87d02a33e03e-bluemix.cloudant.com";
    }

	cloudant = require('cloudant')(dbCredentials.url);
	
	//check if DB exists if not create
	cloudant.db.create(dbCredentials.dbName, function (err, res) {
		if (err) { console.log('could not create db ', err); }
    });
	db = cloudant.use(dbCredentials.dbName);
}

initDBConnection();

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
} : {}
var appEnv = cfenv.getAppEnv(appEnvOpts);

var twitterCreds = appEnv.getServiceCreds("insights-search-twitter");
var twitter = require('./lib/twitter.js')(twitterCreds.url);

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
	db.insert({"msgId": tweet.message.id,
			"msgType": tweet.message.verb,
			"msgPostedTime": tweet.message.postedTime,
			"msgBody": tweet.message.body,
			"msgFavoritesCount": tweet.message.favoritesCount,
			"msgHashtags": tweet.message.twitter_entities.hashtags,
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
			}
	);
}

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
  twitter.search(req.query.q, 20, 0, function (error, body) {
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
  twitter.searchTrack(req.params.id, req.query.q, 20, 0, function (error, body) {
    if (error) {
      res.sendStatus(500);
    }
    res.send(body);
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
