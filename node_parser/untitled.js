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

var ORD = /\b\d+th\b|\b\d+st\b|\b\d+nd\b|\b\d+rd\b/ig;
var DATE1 = /\b(jan|feb|marc|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/ig;
var DATE2 = /\b(january|february|march|april|june|july|august|september|october|november|december)\b/ig;
var DATE3 = /[0-2][0-9]|3[0-1]-DATE2|DATE1-[1-2][0-9][0-9][0-9]/g;
var MONEY1 = /\b.(\$|\€|\¥|\£)([1-9]{1}[0-9]+(\,[0-9]{3})*(\.[0-9]{0,2})?|[1-9]{1}[0-9]{0,}(\.[0-9]{0,2})?|0(\.[0-9]{0,2})?|(\.[0-9]{1,2})?).\b/ig;
var MONEY2 = /\b.(dollar+s?|euro+s?|yen+s?|pound+s?)([1-9]{1}[0-9]+(\,[0-9]{3})*(\.[0-9]{0,2})?|[1-9]{1}[0-9]{0,}(\.[0-9]{0,2})?|0(\.[0-9]{0,2})?|(\.[0-9]{1,2})?).\b/ig;
var MONEY3 = /\b.([1-9]{1}[0-9]+(\,[0-9]{3})*(\.[0-9]{0,2})?|[1-9]{1}[0-9]{0,}(\.[0-9]{0,2})?|0(\.[0-9]{0,2})?|(\.[0-9]{1,2}))(\$|\€|\¥|\£).\b/ig;
var MONEY4 = /\b.([1-9]{1}[0-9]+(\,[0-9]{3})*(\.[0-9]{0,2})?|[1-9]{1}[0-9]{0,}(\.[0-9]{0,2})?|0(\.[0-9]{0,2})?|(\.[0-9]{1,2}))(dollar+s?|euro+s?|yen+s?|pound+s?).\b/ig;





//PHASE 1 -  CREATE DOCS
//    'C:/Users/Giuseppe/Desktop/TAGMining/TAGMining/new_file.warc'
//    '/Volumes/MacbookHD/Documenti/MYSTUFF/RM3/2nd/AGIW/00new.warc'
//    '/Users/tiziano/project_giw/ducumenti_motore_ricerca/02.warc'


fs.createReadStream('/Users/tiziano/project_giw/ducumenti_motore_ricerca/New02.warc')
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
			// ORDINAL OK, DATE TO DO!
			for (var k = 0; k < doc.content.length; k++) {
				doc.content[k] = doc.content[k].replace(ORD, '#ORD')
			.replace(MONEY1, '#MONEY').replace(MONEY2, '#MONEY').replace(MONEY3, '#MONEY').replace(MONEY4, '#MONEY')

			}
			doc.title = doc.title.replace(ORD, '#ORD')
			.replace(MONEY1, '#MONEY').replace(MONEY2, '#MONEY').replace(MONEY3, '#MONEY').replace(MONEY4, '#MONEY')





				console.log(JSON.stringify(doc) + "\n\n\n");


			//handle empty
			//.... TODO
			
		}

		catch (err) {
			console.log("errore");
		}

	});


