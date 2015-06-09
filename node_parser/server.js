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
var html_strip = require('htmlstrip-native');
var removingList = [];

var ORD = /\b\d+th\b|\b\d+st\b|\b\d+nd\b|\b\d+rd\b/igm;


var DATE1 = /\b(january|february|march|april|june|july|august|september|october|november|december|jan|feb|marc|apr|may|jun|jul|aug|sep|oct|nov|dec) (0[1-9]|[12][0-9]|3[0-1]), ((1?[0-9]|20)[0-9][0-9])\b/igm;
var DATE2 = /[1-9]+ ?((b\.c\.)|(a\.?d\.?))/igm
var DATE3 = /\b(19|20)[0-9][0-9]([-|\.|\/])(0[1-9]|1[012])([-|\.|\/])(0[1-9]|[12][0-9]|3[01])\b/igm;
var DATE4 = /\b((0[1-9]|[12][0-9]|3[01]))([-|\.|\/])(0[1-9]|1[012])([-|\.|\/])(19|20)[0-9][0-9]\b/igm;
var DATE5 = /\b(19|20)[0-9][0-9] (january|february|march|april|june|july|august|september|october|november|december|jan|feb|marc|apr|may|jun|jul|aug|sep|oct|nov|dec) ((0[1-9]|[12][0-9]|3[01]))\b/igm;
var DATE6 = /\b(january|february|march|april|june|july|august|september|october|november|december|jan|feb|marc|apr|may|jun|jul|aug|sep|oct|nov|dec) (#ORD)\b/igm;
// date format: "january 21, 2008", "234 b.c.", "1990-12-18", "19-12-1998", "1990 jan 20", "Feb 1st" 



//PHASE 1 -  CREATE DOCS
//    'C:/Users/Giuseppe/Desktop/TAGMining/TAGMining/new_file.warc'
//    '/Volumes/MacbookHD/Documenti/MYSTUFF/RM3/2nd/AGIW/00new.warc'
//    '/Users/tiziano/TAGMining/new_file.warc'


fs.createReadStream('/Volumes/MacbookHD/Documenti/MYSTUFF/RM3/2nd/AGIW/00new.warc')
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
			

			var options = {
				include_script : false,
				include_style : false,
				compact_whitespace : true,
				include_attributes : { 'alt': true }

		};
	 
		// Strip tags and decode HTML entities 
			doc.content = html_strip.html_strip(doc.content, options);
			docs.push(doc);

		//Extract Phrases splitting by . ! ?
			splitString = function(string, splitters) {
	    		var list = [string];
			    for(var i=0, len=splitters.length; i<len; i++) {
			        traverseList(list, splitters[i], 0);
			    }
			    return flatten(list);
			}

			traverseList = function(list, splitter, index) {
			    if(list[index]) {
			        if((list.constructor !== String) && (list[index].constructor === String))
			            (list[index] != list[index].split(splitter)) ? list[index] = list[index].split(splitter) : null;
			        (list[index].constructor === Array) ? traverseList(list[index], splitter, 0) : null;
			        (list.constructor === Array) ? traverseList(list, splitter, index+1) : null;    
			    }
			}

			flatten = function(arr) {
			    return arr.reduce(function(acc, val) {
			        return acc.concat(val.constructor === Array ? flatten(val) : val);
			    },[]);
			}

			var stringToSplit = doc.content;
			var splitList = [". ", "! ", "? "];
			doc.content = splitString(stringToSplit, splitList);


			// Dump short or long phrases
			var arrayTemp = [];
			for (var j = 0; j < doc.content.length; j++) {
				var temp = doc.content[j].split(" ");
				if(temp.length > 4 && temp.length < 39) {
					arrayTemp.push(doc.content[j]);
				}
			}

			//saving trac_id of useless docs to remove them later
			if(arrayTemp.length == 0 || typeof arrayTemp === 'undefined') {
				removingList.push(doc.trec_id);
			}

			doc.content = arrayTemp;
			
			// Replacing interest numbers with TAGS
			// ORDINAL OK, DATE OK!
			for (var k = 0; k < doc.content.length; k++) {
				doc.content[k] = doc.content[k].replace(ORD, '#ORD');
				doc.content[k] = doc.content[k].replace(DATE1, '#DATE').replace(DATE2, '#DATE').replace(DATE3, '#DATE').replace(DATE5, '#DATE').replace(DATE4, '#DATE').replace(DATE6, '#DATE');
			}
			doc.title = doc.title.replace(ORD, '#ORD');
			doc.title = doc.title.replace(DATE1, '#DATE').replace(DATE2, '#DATE').replace(DATE3, '#DATE').replace(DATE5, '#DATE').replace(DATE4, '#DATE').replace(DATE6, '#DATE');



			console.log(JSON.stringify(doc) + "\n\n\n");


			//handle empty
			//.... TODO
			
		}

		catch (err) {
			console.log(err);
		}

	});


