var http = require('http'),
    fs = require('fs'),
    url = require('url'),
    parseString = require('xml2js').parseString;

var WARCStream = require('warc');
var w = new WARCStream();
var output = [];
var title = '';
var i = 0;
var j = 0;

fs.createReadStream('CC-MAIN-20140820021320-00002-ip-10-180-136-8.ec2.internal.warc')
    .pipe(w)
    .on('data', function(data) {
        if (data.headers["WARC-Type"] === "response") {
            output.uri = data.headers["WARC-Target-URI"];
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

        var doc = {
            uri: output.uri,
            title: output.title,
            content: output.content
        }

        try {
            var n = output.content.indexOf("<!DOCTYPE");
            if (n == "-1") //se non esiste "<!DOCTYPE HTML" vai a cercare il tag "<html>"
                var n = output.content.indexOf("<html>");
            var result = output.content.substring(n);
            output.content = result;

            // sostituito i TAG con uno spazio vuoto
            var res = output.content.replace("/<.>/", "");
            output.content = res;

            var doc = {
                uri: output.uri,
                title: output.title,
                content: output.content
            }


        } catch (err) {
            console.log("non è una pagina HTML");
        }

        // Use `var solr = require('solr-client')` in your code 
        var solr = require('solr-client');

        // Create a client
        var client = solr.createClient();

        // Switch on "auto commit", by default `client.autoCommit = false`
        client.autoCommit = true;

        var docs = [];

        var doc = {
            uri: output.uri,
            title: output.title,
            content: output.content
        }
        docs.push(doc);
        // Add documents
        client.add(docs, function(err, obj) {
            if (err) {
                console.log(err);
            } else {
                console.log(output.uri, obj);
            }
        });

    });