var http = require('http'),
  fs = require('fs'),
  url = require('url'),
  parseString = require('xml2js').parseString;

var WARCStream = require('warc');
var w = new WARCStream();
var output = [];
var docs = [];
var title = '';
var trec_id = '';

//PHASE 1 -  CREATE DOCS
//    'C:/Users/Giuseppe/Desktop/TAGMining/TAGMining/new_file.warc'
//    '/Volumes/MacbookHD/Documenti/MYSTUFF/RM3/2nd/AGIW/TAGMining/new_file.warc'
//    '/Users/tiziano/TAGMining/new_file.warc'


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
              (typeof result.HTML.HEAD[0] !== "undefined")
            ) {
            if(result.HTML.HEAD[0].TITLE == null) {
              var indexEndTitle = output.content.search("</title>");
              var indexBeginTitle = output.content.search("<title>") + 7;
              output.title = output.content.substring(indexBeginTitle, indexEndTitle);
              }
              output.title = result.HTML.HEAD[0].TITLE[0];
              }
          });
        } catch (e) {
        }
      }
    }
    try {
      var indexOfBodyBegin = output.content.indexOf("<body>");
      var indexOfBodyEnd = output.content.indexOf("</body>") + 7;
      var doc = {
        trec_id: output.trec_id_long.substring(output.trec_id_long.length - 5, output.trec_id_long.length),
        content: output.content.substring(indexOfBodyBegin, indexOfBodyEnd),
        title: output.title
      }
      // console.log(doc.title);
      
      docs.push(doc);
    }
    catch (err) {
      //console.log("errore");
    }
    //extractPhrase(docs);
    console.log(docs);
  });



//PHASE 2 - EXTRACT PHRASES

function extractPhrases(docs) {
  for (var i = 0; i < docs.length; i++) {

    var html_strip = require('htmlstrip-native');
   
    
    var options = {
        include_script : false,
        include_style : false,
        compact_whitespace : true,
        include_attributes : { 'alt': true }

    };
   
  // Strip tags and decode HTML entities 
    var text = html_strip.html_strip(docs[i].content, options);
   
    console.log("\n\n\n\n" + docs[i].trec_id + "\t\t" +text);
  }
}





