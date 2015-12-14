// Licensed under the Apache License. See footer for details.
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
				'"MESSAGE_ID" VARCHAR(256), ' +
				'"MESSAGE_BODY" VARCHAR(1024), ' +
				'"MESSAGE_FAVORITES_COUNT" BIGINT, ' +
				'"MESSAGE_POSTED_TIME" VARCHAR(32), ' +
				'"MESSAGE_TYPE" VARCHAR(8), ' +
				'"SENTIMENT" VARCHAR(16), ' +
				'"AUTHOR_CITY" VARCHAR(64), ' +
				'"AUTHOR_STATE" VARCHAR(64), ' +
				'"AUTHOR_COUNTRY" VARCHAR(64), ' +
				'"AUTHOR_GENDER" VARCHAR(8), ' +
				'"AUTHOR_IS_MARRIED" VARCHAR(8), ' +
				'"AUTHOR_IS_PARENT" VARCHAR(8), ' +
				'"AUTHOR_PREFERRED_USERNAME" VARCHAR(128), ' +
				'"AUTHOR_DISPLAY_NAME" VARCHAR(64), ' +
				'"AUTHOR_FOLLOWER_COUNT" BIGINT, ' +
				'"AUTHOR_FRIEND_COUNT" BIGINT, ' +
				'"AUTHOR_ID" VARCHAR(128), ' +
				'"AUTHOR_LISTED_COUNT" BIGINT);';
			
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
				conn.close(function(err) {
					if(err) console.log("Problem disconnecting from dashDB");
					else console.log("Connection closed successfully.");
				});
			});
		});
	});
}

initDBConnection();

function queryDB(query, result) {
	console.log("attempting to query dashDB with " + query);
	db.open(dashDBcredentials.dsn, function(err, conn) {
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
					conn.close(function(err) {
						if(err) console.log("Problem disconnecting from dashDB");
						else console.log("Connection closed successfully.");
					});
					
					console.log("queryDB text: " + text);
					result(text);
				}
			});
		}
	});
}

function insertTweetIntoDB(data) {
	console.log("attempting to insert " + data + " into dashDB");
	
	var tweet = JSON.parse(data);
	
	console.log(tweet);
	
	db.open(dashDBcredentials.dsn, function(err, conn) {
		if(err) {
			console.log("Unable to connect to dashDB");
			console.error("Error: ", err);
			return;
		}
		
		// unfortunately javascript parses json strangely, so we need to break down the data
		var message = JSON.parse(JSON.stringify(tweet.message));
		var content = JSON.parse(JSON.stringify(tweet.cde.content));
		var sentiment = JSON.parse(JSON.stringify(content.sentiment));
		var author = JSON.parse(JSON.stringify(tweet.cde.author));
		var location = JSON.parse(JSON.stringify(author.location));
		var actor = JSON.parse(JSON.stringify(message.actor));
		
		// may want to query based on message_id to not add duplicates
		
		var insertStatement = "INSERT INTO TWITTER_DB VALUES ('" +
				message.id + "', '" +
				message.body + "', " +
				message.favoritesCount + ", '" +
				message.postedTime + "', '" +
				message.verb + "', '" +
				sentiment.polarity + "', '" +
				location.city + "', '" +
				location.state + "', '" +
				location.country + "', '" +
				author.gender + "', '" +
				author.maritalStatus.isMarried + "', '" +
				author.parenthood.isParent + "', '" +
				actor.preferredUsername + "', '" +
				actor.displayName + "', " +
				actor.followersCount + ", " +
				actor.friendsCount + ", '" +
				actor.id + "', " +
				actor.listedCount + ");";
			
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
				conn.close(function(err) {
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

var twitterCreds = appEnv.getServiceCreds("social-media-test-twitter");
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
		 //console.log(JSON.stringify(tweets[i]));
		 insertTweetIntoDB(JSON.stringify(tweets[i]));
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
	queryDB("SELECT MSG_BODY FROM TWITTER_DB WHERE USER_PREFERRED_USERNAME = 'BarackObama'", result);
	res.send(result);
});

app.get("/select", function(req, res) {
	db.open(dashDBcredentials.dsn, function(err, conn) {
		if(err) {
			console.log("Unable to connect to dashDB");
			console.error("Error: ", err);
			return;
		} else {
			var query = "SELECT MSG_BODY FROM TWITTER_DB WHERE USER_PREFERRED_USERNAME = 'BarackObama'";
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
