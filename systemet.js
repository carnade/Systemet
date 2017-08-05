var xml2js = require('xml2js');
var fs = require('fs');
var mysql = require('mysql');
var wget = require('wget-improved');
var Prowl = require('node-prowl');

fs.readFile('pwd', 'utf8', function(err, readPwd){
    var pass = readPwd.replace(/\n$/,'');
    var connection = mysql.createConnection({
        host    :   '192.168.1.101',
        user    :   'testuser',
        password    : pass,
        database    : 'systemet'
        //,        multipleStatements: true,
    });

    //wget-improved
    var src = 'https://www.systembolaget.se/api/assortment/products/xml';
    var today = new Date().toISOString().slice(0,10);
    console.log('today: ' + today);
    var output = 'data/'+ today;
    var options = {};
    console.log("1. Downloading xml...");
    var download = wget.download(src, output, options);
    download.on('error', function(err) {
        console.log(err);
        process.exit(1);
    });
/*
    //select -> delete old values
    connection.connect(function(err) {
        console.log("2. Deleting rows...");
        if (err) throw err;
            connection.query('CALL `delete_mindate_posts`', function(err, result, fields) {
            if (err) throw err;
        });
        connection.end();
    });

    //parse and insert new values
    fs.readFile('data/' + '170621.xml', function(err, data){
        console.log("3. Inserting rows...");
        var parser = new xml2js.Parser();
        parser.parseString(data, function(err,result){
          //Extract the value from the data element
          createdTime = result.artiklar['skapad-tid'];
          //extractedData = result.artiklar.artikel[1].nr;
          connection.connect(function(err) {
            if (err) throw err;
            console.log('3.1 Inserting ' + result.artiklar.artikel.length + ' items!');
            for(var i = 0; i < result.artiklar.artikel.length; i++){
                var obj = result.artiklar.artikel[i];
                //console.log('INSERT: ' + ' ' + obj.nr + ' ' + obj.Namn + ' ' + obj.Prisinklmoms);
                post = {
                    number  : obj.nr,
                    object  : obj.Varnummer,
                    name    : obj.Namn + ' ' + obj.Namn2,
                    price   : obj.Prisinklmoms,
                    volume  : obj.Volymiml,
                    alcohol : obj.Alkoholhalt,
                    type    : obj.Varugrupp,
                    subtype : obj.Typ,
                    origin  : obj.Ursprung,
                    country : obj.Ursprunglandnamn,
                    producer: obj.Producent,
                    date    : createdTime
                };
                connection.query("INSERT INTO data SET ?", post, function (err, result, fields) {
                if (err) throw err;
                //    console.log(result);
                });
            }
            connection.end();
          });
        });
    });

    // Select diff
    connection.connect(function(err) {
        if (err) throw err;
        console.log("4. Get all pricereductions...");
        connection.query('CALL `get_pricereduction`', function(err, rows, fields) {
            if (err) throw err;
            fs.readFile('prowl', 'utf8', function(err, readProwl){
                var prowlApiKey = readProwl.replace(/\n$/,'');
                var prowl = new Prowl(prowlApiKey);
                console.log("5. Insert pricereductions...");
                if (rows[0].length > 0) {
                    //Insert diff
                    rows[0].forEach(function(obj){
                        console.log(obj);
                        reducedPost = {
                            number  : obj.number,
                            object  : obj.object,
                            name    : obj.name,
                            price   : obj.price,
                            oldPrice: obj.oldPrice,
                            reduction: obj.reduction*100,
                            volume  : obj.volume,
                            alcohol : obj.alcohol,
                            type    : obj.type,
                            subtype : obj.subtype,
                            origin  : obj.origin,
                            country : obj.country,
                            producer: obj.producer,
                            date    : obj.date
                        };
                        connection.query("INSERT INTO reductions SET ?", reducedPost, function(err, result, fields){
                            if (err) throw err;
                        });
                    });
                    connection.end();
                    console.log("6. Prowl pricereductions...");
                    if (rows[0].length < 5) {
                        rows[0].forEach(function(result){
                            prowl.push('Prissänkning: (' + result.object + ') ' + result.name + ' Förut: ' + result.oldPrice + ' Nu: ' + result.price + '',
                                'Systembolaget',
                                {priority: -2
                                //,url: 'http://www.systembolaget.se/sok-dryck/?searchquery=' + result.object
                                },
                                function(err, remaining) {
                                    if (err) throw err;
                                    console.log('Remaining calls: ' + remaining);
                                });
                        });
                    } else {
                        prowl.push('För många prissänkningar: ' + rows[0].length +'st', 'Systembolaget', function(err, remaining) {
                            if (err) throw err;
                            console.log('Remaining calls: ' + remaining);
                        });
                    }
                } else {
                    connection.end();
                }
            });
        });
    });*/
});
