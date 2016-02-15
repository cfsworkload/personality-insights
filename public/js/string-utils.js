// Copyright (c) 2016 IBM Corp. All rights reserved.
// Use of this source code is governed by the Apache License,
// Version 2.0, a copy of which can be found in the LICENSE file.

'use strict';

/**
 * Given a template string to format and serveral strings
 * to fill the template, it returns the formatted string.
 * @param template This is a string containing zero, one or
 *                 more occurrences of "%s".
 * @param ...strings
 * @returns The formattted template.
 */
function format() {
  var replaces = Array.prototype.slice.apply(arguments, [1, arguments.length]);
  var subject = arguments[0];
  var parts = null;
  if ((subject.match(/%s/g) === null && replaces.length > 0) || replaces.length !== subject.match(/%s/g).length) {
    throw 'Format error: The string count to replace do not matches the argument count. Subject: ' + subject + '. Replaces: ' + replaces;
  }

  var output = subject;
  for (var i = 1; i < arguments.length; i++) {
    parts = output.split('%s');
    output = parts[0] + arguments[i] + parts.slice(1,parts.length).join('%s');
  }

  return output;
}
