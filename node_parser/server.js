var http = require('http'),
	fs = require('fs'),
	url = require('url'),
	parseString = require('xml2js').parseString,
	html_strip = require('htmlstrip-native'),
	WARCStream = require('warc');

var w = new WARCStream();
var output = {};
var title = '';
var trec_id = '';
var removingList = [];

var wstream_out1 = fs.createWriteStream('/Volumes/MacbookHD/Documenti/MYSTUFF/RM3/2nd/AGIW/TAGMining/OUT1.txt');
wstream_out1.write('trec_id\t\tString\t\tTag\n');


var wstream_out2 = fs.createWriteStream('/Volumes/MacbookHD/Documenti/MYSTUFF/RM3/2nd/AGIW/TAGMining/OUT2.txt');
wstream_out2.write('trec_id\tOld_String\n');

var wstream_out3 = fs.createWriteStream('/Volumes/MacbookHD/Documenti/MYSTUFF/RM3/2nd/AGIW/TAGMining/OUT3.txt');
wstream_out3.write('trec_id\tNew_String\n');




var ORD = /\b\d+th\b|\b\d+st\b|\b\d+nd\b|\b\d+rd\b/igm;


var DATE1 = /\b(january|february|march|april|june|july|august|september|october|november|december|jan|feb|marc|apr|may|jun|jul|aug|sep|oct|nov|dec)\s(0?[1-9]|[12][0-9]|3[0-1])(,\s((1?[0-9]|20)[0-9][0-9]))?\b/igm;
var DATE3 = /\b(19|20)[0-9][0-9]([-|\.|\/|\s])(0[1-9]|1[012])([-|\.|\/|\s])(0?[1-9]|[12][0-9]|3[01])\b/igm;
var DATE4 = /\b((0?[1-9]|[12][0-9]|3[01]))([-|\.|\/|\s])(0?[1-9]|1[012])([-|\.|\/|\s])(19|20)[0-9][0-9]\b/igm;
var DATE5 = /\b(19|20)[0-9][0-9]\s(january|february|march|april|june|july|august|september|october|november|december|jan|feb|marc|apr|may|jun|jul|aug|sep|oct|nov|dec)\s((0?[1-9]|[12][0-9]|3[01]))\b/igm;
var DATE6 = /\b((0?[1-9]|[12][0-9]|3[01]))\s(january|february|march|april|june|july|august|september|october|november|december|jan|feb|marc|apr|may|jun|jul|aug|sep|oct|nov|dec)(\,)?\s(19|20)[0-9][0-9]\b/igm;
var DATE7 = /\b(january|february|march|april|june|july|august|september|october|november|december|jan|feb|marc|apr|may|jun|jul|aug|sep|oct|nov|dec)\s(#ORD)\b/igm;

// date format: "january 21, 2008", "234 b.c.", "1990-12-18", "19-12-1998", "1990 jan 20","12 jan 2008", "Feb 1st" 

var MONEY1 = /(\$|\€|\¥|\£)\s?([1-9][0-9]+(\,[0-9]{3})*(\.[0-9]{0,2})?|[1-9]{1}[0-9]{0,}(\.[0-9]{0,2})?|0(\.[0-9]{0,2})|(\.[0-9]{1,2}))(\smillion(s)?|\sbillion(s)?|\sbn|\smn)?(million(s)?|billion(s)?|bn|mn)?/igm;
var MONEY2 = /(dollar(s?)|euro(s?)|yen(s?)|pound(s?))\s?([1-9][0-9]+(\,[0-9]{3})*(\.[0-9]{0,2})?|[1-9]{1}[0-9]{0,}(\.[0-9]{0,2})?|0(\.[0-9]{0,2})|(\.[0-9]{1,2}))(\smillion(s)?|\sbillion(s)?|\sbn|\smn)?(million(s)?|billion(s)?|bn|mn)?/igm;
var MONEY3 = /([1-9][0-9]+(\,[0-9]{3})*(\.[0-9]{0,2})?|[1-9]{1}[0-9]{0,}(\.[0-9]{0,2})?|0(\.[0-9]{0,2})|(\.[0-9]{1,2}))\-?(\smillion(s)?|\sbillion(s)?|\sbn|\smn)?(million(s)?|billion(s)?|bn|mn)?(\s?dollar(s?)|\s?euro(s?)|\s?yen(s?)|\?pound(s?))/igm;
var MONEY4 = /([1-9][0-9]+(\,[0-9]{3})*(\.[0-9]{0,2})?|[1-9]{1}[0-9]{0,}(\.[0-9]{0,2})?|0(\.[0-9]{0,2})|(\.[0-9]{1,2}))\-?(\smillion(s)?|\sbillion(s)?|\sbn|\smn)?(million(s)?|billion(s)?|bn|mn)?(\s?\$|\s?\€|\s?\¥|\s?\£)/igm;


var DIST1 = /\b((0\.[0-9]+)|([1-9](\,)?(\.)?[0-9]*(\,)?(\.)?[0-9]*(\,)?))\s?(kilometer(s?)|meter(s?)|mile(s?)|centimeter(s?)|millimeter(s?)|foot|feet|yard(s?)|inch((es)?)|km|m|cm|mm|ft|yd|mi|nmi|nm|ly)\b/igm;
var DIST2 = /\b(kilometer(s?)|meter(s?)|mile(s?)|centimeter(s?)|millimeter(s?)|foot|feet|yard(s?)|inch((es)?)|km|m|cm|mm|ft|yd|mi|nmi|nm|ly)(\.)?\s?((0\.[0-9]+)|([1-9](\,)?(\.)?[0-9]*(\,)?(\.)?[0-9]*(\,)?))\b/igm;

// distance format: "0.1 km", "0.2m", "100 kilometers", "65yards", "KM. 121", "100,292.76 ft"

var PHONE = /(\(\+\d\d?\d?\)\s)?(1\s*[-\/\.]?)?(\((\d{3})\)|(\d{3}))\s*[-\/\.]?\s*(\d{3})\s*[-\/\.]?\s*(\d{4})\s*(([xX]|[eE][xX][tT])\.?\s*(\d+))*/igm;

// phone format: "1(240) 652-5009", "(658)154-1122",  "658-154-1122", "1-(123)-123-1234"

var TIME = /(1[\d]|[1-9]|00|2[0|1|2|3|4]|0[\d])(:|(\s)?h(\s)?)[0-5][0-9](:|(\s)?m(\s)?)([0-5][0-9](\s)?s?)?((\s)?am|(\s)?pm)?\b/igm;

// time format: "12:34:00", "01:09:00", "20:00:00", "12h34m30s", "20h40m00s", "12:00:00pm", "12:00:00am"

var EMAIL = /((?:(?:(?:[a-zA-Z0-9][\.\-\+_]?)*)[a-zA-Z0-9])+)\@((?:(?:(?:[a-zA-Z0-9][\.\-_]?){0,62})[a-zA-Z0-9])+)\.([a-zA-Z0-9]{2,6})/igm;

// email format: "foo@bar.com", "foo+bar@foo_bar.gh", "abc5678@d666ef.com"

var URL = /((http|ftp|https):\/{2})?(([0-9a-z_-]+\.)(aero|asia|biz|cat|com|coop|edu|gov|info|int|jobs|mil|mobi|museum|name|net|org|pro|tel|travel|ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cu|cv|cx|cy|cz|cz|de|dj|dk|dm|do|dz|ec|ee|eg|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mn|mn|mo|mp|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|nom|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ra|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sj|sk|sl|sm|sn|so|sr|st|su|sv|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tp|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|yu|za|zm|zw|arpa)(:[0-9]+)?)/igm;

// url format: "http://abc.com/abc_abc", "http://abc.com/abc_abc/", "http://abc.com/asd(abc)", "http://www.foo.com/bar/?p=111" , "http://1337.org"


//PHASE 1 -  CREATE DOCS
//    'C:/Users/Giuseppe/Desktop/TAGMining/TAGMining/new_file.warc'
//    '/Volumes/MacbookHD/Documenti/MYSTUFF/RM3/2nd/AGIW/00new.warc'
//    '/Users/tiziano/project_giw/ducumenti_motore_ricerca/New02.warc'


fs.createReadStream('/Volumes/MacbookHD/Documenti/MYSTUFF/RM3/2nd/AGIW/00new.warc')
	.pipe(w)
	.on('data', function(data) {
		if (data.headers["WARC-Type"] === "response") {
			output.trec_id_long = data.headers["WARC-Trec-ID"];
			output.content = data.content.toString();

		}
		try {
			var indexOfBodyBegin = output.content.indexOf("<body>");
			var indexOfBodyEnd = output.content.indexOf("</body>") + 7;

			//Removing a tags
			var a_tag = /<a(.*?)<\/a>/gmi;
			output.content = output.content.replace(a_tag, "");

			var doc = {
				trec_id: output.trec_id_long.substring(output.trec_id_long.length - 5, output.trec_id_long.length),
				content: output.content.substring(indexOfBodyBegin, indexOfBodyEnd),
			}
			

			var options = {
				include_script : false,
				include_style : false,
				compact_whitespace : true
		};
	 
		// Strip tags and decode HTML entities 
			doc.content = html_strip.html_strip(doc.content, options);

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


			// Remove short or long phrases
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
			var isConsistent = true;

			// writing on file
			for(var x = 0; x<removingList.length;x++) {
				if(doc.trec_id === removingList[x]) {
					isConsistent = false;
				}
			}


			// FILLING FIRST OUTPUT: MATCHES AND TAGS
			for (var z = 0; z < doc.content.length; z++) {
				if(doc.content[z].search(ORD) !== -1) {
					var matchORD = doc.content[z].match(ORD); 
	    			wstream_out1.write(doc.trec_id + "\t\t" + matchORD + "\t\t" + '#ORD' + "\n");

				}
				if(doc.content[z].search(DATE1) !== -1) {
					var matchDATE = doc.content[z].match(DATE1);
					wstream_out1.write(doc.trec_id + "\t\t" + matchDATE + "\t\t" + '#DATE' + "\n");
				}
				if(doc.content[z].search(DATE3) !== -1) {
					var matchDATE = doc.content[z].match(DATE3);
					wstream_out1.write(doc.trec_id + "\t\t" + matchDATE + "\t\t" + '#DATE' + "\n");

				}
				if(doc.content[z].search(DATE4) !== -1) {
					var matchDATE = doc.content[z].match(DATE4);
					wstream_out1.write(doc.trec_id + "\t\t" + matchDATE + "\t\t" + '#DATE' + "\n");

				}
				if(doc.content[z].search(DATE5) !== -1) {
					var matchDATE = doc.content[z].match(DATE5);
					wstream_out1.write(doc.trec_id + "\t\t" + matchDATE + "\t\t" + '#DATE' + "\n");

				}
				if(doc.content[z].search(DATE6) !== -1) {
					var matchDATE = doc.content[z].match(DATE6);
					wstream_out1.write(doc.trec_id + "\t\t" + matchDATE + "\t\t" + '#DATE' + "\n");

				}
				if(doc.content[z].search(DATE7) !== -1) {
					var matchDATE = doc.content[z].match(DATE7);
					wstream_out1.write(doc.trec_id + "\t\t" + matchDATE + "\t\t" + '#DATE' + "\n");
					
				}
				if(doc.content[z].search(MONEY1) !== -1) {
					var matchMONEY = doc.content[z].match(MONEY1);
					wstream_out1.write(doc.trec_id + "\t\t" + matchMONEY + "\t\t" + '#MONEY' + "\n");

				}
				if(doc.content[z].search(MONEY2) !== -1) {
					var matchMONEY = doc.content[z].match(MONEY2);
					wstream_out1.write(doc.trec_id + "\t\t" + matchMONEY + "\t\t" + '#MONEY' + "\n");

				}				
				if(doc.content[z].search(MONEY3) !== -1) {
					var matchMONEY = doc.content[z].match(MONEY3);
					wstream_out1.write(doc.trec_id + "\t\t" + matchMONEY + "\t\t" + '#MONEY' + "\n");

				}				
				if(doc.content[z].search(MONEY4) !== -1) {
					var matchMONEY = doc.content[z].match(MONEY4);
					wstream_out1.write(doc.trec_id + "\t\t" + matchMONEY + "\t\t" + '#MONEY' + "\n");

				}				
				if(doc.content[z].search(DIST1) !== -1) {
					var matchDIST = doc.content[z].match(DIST1);
					wstream_out1.write(doc.trec_id + "\t\t" + matchDIST + "\t\t" + '#DIST' + "\n");

				}
				if(doc.content[z].search(DIST2) !== -1) {
					var matchDIST = doc.content[z].match(DIST2);
					wstream_out1.write(doc.trec_id + "\t\t" + matchDIST + "\t\t" + '#DIST' + "\n");

				}
				if(doc.content[z].search(PHONE) !== -1) {
					var matchPHONE = doc.content[z].match(PHONE);
					wstream_out1.write(doc.trec_id + "\t\t" + matchPHONE + "\t\t" + '#PHONE' + "\n");

				}		
				if(doc.content[z].search(TIME) !== -1) {
					var matchTIME = doc.content[z].match(TIME);
					wstream_out1.write(doc.trec_id + "\t\t" + matchTIME + "\t\t" + '#TIME' + "\n");

				}
			
				if(doc.content[z].search(URL) !== -1) {
					var matchURL = doc.content[z].match(URL);
					wstream_out1.write(doc.trec_id + "\t\t" + matchURL + "\t\t" + '#URL' + "\n");

				}
			}


			// FILLING SECOND OUTPUT: OLD PHRASES DUMP
			if(isConsistent) {
				for(var y = 0; y<doc.content.length; y++) {
					wstream_out2.write(doc.trec_id + "\t" + doc.content[y] + "\n");
				}
			
			}

			// Replacing interest numbers with TAGS from body
			for (var k = 0; k < doc.content.length; k++) {
				doc.content[k] = doc.content[k].replace(ORD, '#ORD');
				doc.content[k] = doc.content[k].replace(DATE1, '#DATE').replace(DATE3, '#DATE').replace(DATE5, '#DATE').replace(DATE4, '#DATE').replace(DATE6, '#DATE').replace(DATE7, '#DATE');
				doc.content[k] = doc.content[k].replace(MONEY1, '#MONEY').replace(MONEY2, '#MONEY').replace(MONEY3, '#MONEY').replace(MONEY4, '#MONEY');
				doc.content[k] = doc.content[k].replace(DIST1, '#DIST1').replace(DIST2, '#DIST2');
				doc.content[k] = doc.content[k].replace(PHONE, ' #PHONE ');
				doc.content[k] = doc.content[k].replace(TIME, '#TIME ');
				doc.content[k] = doc.content[k].replace(URL, '#URL');

			}
			

			// FILLING THIRD OUTPUT: NEW PHRASES DUMP
			if(isConsistent) {
				for(var y = 0; y<doc.content.length; y++) {
					wstream_out3.write(doc.trec_id + "\t" + doc.content[y] + "\n");
				}
				console.log(doc.trec_id);
			}
		}

		catch (err) {
			console.log(err + "  CATCH");
		}
		//isConsistent =  true;
	});




