var xml2js = require('xml2js');
var fs = require('fs');
var mysql = require('mysql');
//var wget = require('node-wget-promise');
var wget = require('wget-improved');
var Prowl = require('node-prowl');
var Q = require('q');

var connection;

//1
 function init_read() {
     //var init_read =
    console.log("1. Init connection...");
    var d = Q.defer();
    fs.readFile('pwd', 'utf8', function(err, readPwd) {
        if (err) throw err;
        var pass = readPwd.replace(/\n$/, '');
        connection = mysql.createConnection({
            host: '192.168.1.101',
            user: 'testuser',
            password: pass,
            database: 'systemet'
        //,        multipleStatements: true,
    });
        console.log("return init");
        d.resolve();
    });

    return d.promise;
};
//2
//var get_data = function () {
function get_data() {
    //wget-improved

    var d = Q.defer();
    console.log("2. Get new data...");
    var src = 'https://www.systembolaget.se/api/assortment/products/xml';
    var today = new Date().toISOString().slice(0, 10);
    //console.log('today: ' + today);
    var output = 'data/' + today;
    var options = {};
    //options.gunzip = false;
    //(async () => {
        var download = /*await*/ wget.download(src, output, options);
        download.on('error', function(err) {
            console.log(err);
            if (err) throw err;
        });
        download.on('end', function(err) {
             console.log('done');
            d.resolve();
        });

    //})();
    //d.resolve();
    return d.promise;
};

//3
//var delete_old_posts = function () {
function delete_old_posts() {
    //select -> delete old values
    var d = Q.defer();
    console.log("3. Deleting rows...");
    var today = new Date().toISOString().slice(0, 10);
    //fs.readFile('data/' + today, function(err, data) {
    connection.connect(function(err) {
        if (err) throw err;
         connection.query('CALL `delete_mindate_posts`', function(err, result, fields) {
            if (err) throw err;
            connection.end();
        });
        d.resolve();
    });
    //});
    return d.promise;
};
//4
//var insert_data = function () {
function insert_data() {
    //parse and insert new values
    console.log("4. Inserting rows...");
    var d = Q.defer();
    var today = new Date().toISOString().slice(0, 10);
    //fs.readFile('data/' + today, function(err, data) {
    fs.readFile('data/' + 'test2.xml', function(err, data) {
        var parser = new xml2js.Parser();
        connection.connect(function(err) {
            parser.parseString(data, function(err, result) {
                //Extract the value from the data element
                createdTime = result.artiklar['skapad-tid'];
                //extractedData = result.artiklar.artikel[1].nr;
                /*              connection.connect(function(err) {
                                if (err) throw err;*/
                console.log('3.1 Inserting ' + result.artiklar.artikel.length + ' items!');

                for (var i = 0; i < result.artiklar.artikel.length; i++) {
                    var obj = result.artiklar.artikel[i];
                    //console.log('INSERT: ' + ' ' + obj.nr + ' ' + obj.Namn + ' ' + obj.Prisinklmoms);
                    post = {
                        number: obj.nr,
                        object: obj.Varnummer,
                        name: obj.Namn + ' ' + obj.Namn2,
                        price: obj.Prisinklmoms,
                        volume: obj.Volymiml,
                        alcohol: obj.Alkoholhalt,
                        type: obj.Varugrupp,
                        subtype: obj.Typ,
                        origin: obj.Ursprung,
                        country: obj.Ursprunglandnamn,
                        producer: obj.Producent,
                        date: createdTime
                    };
                    connection.query("INSERT INTO data SET ?", post, function(err, result, fields) {
                        if (err) throw err;
                        //    console.log(result);
                    });
                    //d.resolve();
                }
                connection.end();

            //});
            });
        });
    });
    return d.promise;
};
//5
//var find_insert_prowl_diff = function () {
function find_insert_prowl_diff() {
    // Select diff
    var d = Q.defer();
    var today = new Date().toISOString().slice(0, 10);
    //fs.readFile('data/' + today, function(err, data) {
    connection.connect(function(err) {
        if (err) throw err;

        console.log("4. Get all pricereductions...");
        connection.query('CALL `get_pricereduction`', function(err, rows, fields) {
            if (err) throw err;
            fs.readFile('prowl', 'utf8', function(err, readProwl) {
                var prowlApiKey = readProwl.replace(/\n$/, '');
                var prowl = new Prowl(prowlApiKey);
                console.log("5. Insert pricereductions...");
                if (rows[0].length > 0) {
                    console.log("5.1 Insert some items...");
                    //Insert diff
                    rows[0].forEach(function(obj) {
                        console.log(obj);
                        reducedPost = {
                            number: obj.number,
                            object: obj.object,
                            name: obj.name,
                            price: obj.price,
                            oldPrice: obj.oldPrice,
                            reduction: obj.reduction * 100,
                            volume: obj.volume,
                            alcohol: obj.alcohol,
                            type: obj.type,
                            subtype: obj.subtype,
                            origin: obj.origin,
                            country: obj.country,
                            producer: obj.producer,
                            date: obj.date
                        };
                        connection.query("INSERT INTO reductions SET ?", reducedPost, function(err, result, fields) {
                            if (err) throw err;
                        });
                    });
                    connection.end();
                    console.log("6. Prowl pricereductions...");
                    if (rows[0].length < 5) {
                        rows[0].forEach(function(result) {
                            prowl.push('Prissänkning: (' + result.object + ') ' + result.name + ' Förut: ' + result.oldPrice + ' Nu: ' + result.price + '',
                                'Systembolaget', {
                                    priority: -2
                                    //,url: 'http://www.systembolaget.se/sok-dryck/?searchquery=' + result.object
                                },
                                function(err, remaining) {
                                    if (err) throw err;
                                    console.log('Remaining calls: ' + remaining);
                                });
                        });
                    } else {
                        prowl.push('För många prissänkningar: ' + rows[0].length + 'st', 'Systembolaget', function(err, remaining) {
                            if (err) throw err;
                            console.log('Remaining calls: ' + remaining);
                        });
                    }
                } else {
                    console.log("5.2 Nothing to insert...");
                    connection.end();
                }
            d.resolve();
            });
        });
    });
    return d.promise;

};            //});

init_read()
.then(get_data)
.then(delete_old_posts)
.then(insert_data)
.then(find_insert_prowl_diff)
.done();
/*init_read()
.then(insert_data());*/
