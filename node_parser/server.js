var http = require('http'),
  fs = require('fs'),
  url = require('url'),
  parseString = require('xml2js').parseString;

var WARCStream = require('warc');
var w = new WARCStream();
var output = [];
var title = '';
var trec_id = '';
var i = 0;

//PHASE 1 -  CREATE DOCS
fs.createReadStream('/Volumes/MacbookHD/Documenti/MYSTUFF/RM3/2nd/AGIW/TAGMining/new_file.warc')
  .pipe(w)
  .on('data', function(data) {
    if (data.headers["WARC-Type"] === "response") {
      output.trec_id_long = data.headers["WARC-Trec-ID"];
      output.content = data.content.toString();
      if (output.content.indexOf('Content-Type: text/html') > -1) {
        try {
          parseString(output.content, {
            strict: false
          }, function(err, result) {
            if (
              (typeof result !== "undefined") &&
              (typeof result.HTML !== "undefined") &&
              (typeof result.HTML.HEAD !== "undefined") &&
              (typeof result.HTML.HEAD[0] !== "undefined") &&
              (typeof result.HTML.HEAD[0].TITLE !== "undefined")
            ) {
              output.title = result.HTML.HEAD[0].TITLE[0];
            }
          });
        } catch (e) {
          i++;
          console.log("ERRORE NUMERO " + i);
        }
      }
    }

    try {

      var doc = {
        trec_id: output.trec_id_long.substring(output.trec_id_long.length - 5, output.trec_id_long.length),
        title: output.title,
        content: output.content

      }
      console.log(doc.trec_id);
      console.log(doc.title);

      



      var docs = [];
      docs.push(doc);
    } catch (err) {
      console.log("errore");
    }
    // extractPhrase(docs);
  });

// // PHASE 2 - EXTRACT PHRASES

// function extractPhrases(docs) {

// }













