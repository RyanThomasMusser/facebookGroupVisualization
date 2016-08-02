#!/usr/bin/env node

/*

THIS FILE IS AN ABSOLUTE MESS RIGHT NOW!

I've been hacking it up to use as needed to reformat
the raw data, which will be removed before uploading to github...

*/

//we'll need this when writing to files in separate directories
var path = require("path")
//we'll want to write to a file
var fs = require('fs')

//let's import our desired shit
var lib = require('./lib')

//var raw_data = require( './parliament_posts.json' )

var parliamentObject = require( './output/output_copy.json' )

Object.keys(parliamentObject).map(function(value) {

  var top50 = Object.keys(parliamentObject[value].words).sort(function(a, b) { return parliamentObject[value].words[a] < parliamentObject[value].words[b] ? 1 : -1; })
          .slice(0, 50);

  var words_holder = parliamentObject[value].words

  parliamentObject[value].words = {}

  top50.map(function(word){
    parliamentObject[value].words[word] = words_holder[word]
  });

});

//var stop_words = require( './stop_words.json' )

/*
What are stop words?
http://xpo6.com/list-of-english-stop-words/

Where did I get our stop words?
https://github.com/huned/node-stopwords/blob/master/english.js
*/

/*
var parliament_closure = lib.facebook_post_analyzer()

parliament_closure.importData(raw_data)
parliament_closure.importStopWords(stop_words)
parliament_closure.processData()

var file_path = path.join(__dirname, './output', 'output.json')
*/

var file_path = path.join(__dirname, './output', 'refined_output.json')

//let's create a blank file to put the data
fs.closeSync(fs.openSync(file_path, 'w'))

//let's create/write the formatted data to /fund_prices.js
//fs.writeFile(file_path, JSON.stringify(parliament_closure.fetchUserData()), function(err) {
fs.writeFile(file_path, JSON.stringify(parliamentObject), function(err) {

  if(err) {
      console.log(err);
      console.log('Whoops! It looks like the process was not completed...');
      //I like to add these new lines to the output
      //it makes it more human readable
      console.log(' ');
      return;
  }

  console.log('Success! The process has been successfully completed.');
  //I like to add these new lines to the output
  //it makes it more human readable
  console.log(' ');
});
