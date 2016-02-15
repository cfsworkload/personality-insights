// Copyright (c) 2016 IBM Corp. All rights reserved.
// Use of this source code is governed by the Apache License,
// Version 2.0, a copy of which can be found in the LICENSE file.

var request = require('request');

function Twitter(url) {
  var self = this;

  self.count = function (query, callback) {
    request.get(
      url + "/api/v1/messages/count?q=" + encodeURIComponent(query), {
        json: true
      },
      function (error, response, body) {
        callback(error, body);
      });
  };

  self.search = function (query, size, from, callback) {
    request.get(
      url + "/api/v1/messages/search?size=" + size +
      "&from=" + encodeURIComponent(from) +
      "&q=" + encodeURIComponent(query), {
        json: true
      },
      function (error, response, body) {
        callback(error, body);
      });
  }

  self.getTracks = function (callback) {
    request.get(
      url + "/api/v1/tracks", {
        json: true
      },
      function (error, response, body) {
        callback(error, body);
      });
  }

  self.countTrack = function (trackId, query, callback) {
    request.get(
      url + "/api/v1/tracks/" + trackId + "/messages/count?q=" + encodeURIComponent(query), {
        json: true
      },
      function (error, response, body) {
        callback(error, body);
      });
  };

  self.searchTrack = function (trackId, query, size, from, callback) {
    request.get(
      url + "/api/v1/tracks/" + trackId + "/messages/search?size=" + size +
      "&from=" + encodeURIComponent(from) +
      "&q=" + encodeURIComponent(query), {
        json: true
      },
      function (error, response, body) {
        callback(error, body);
      });
  }
}

module.exports = function (url) {
  return new Twitter(url);
};
