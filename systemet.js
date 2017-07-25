var xml2js = require('xml2js');
var fs = require('fs');
var mysql = require('mysql');

fs.readFile('pwd', 'utf8', function(err, readPwd){
    var pass = readPwd.replace(/\n$/,'');
    var connection = mysql.createConnection({
        host    :   '192.168.1.101',
        user    :   'testuser',
        password    : pass,
        database    : 'systemet'
        //,        multipleStatements: true,
    });
//    console.log(connection);

    fs.readFile('data/xml', function(err, data){
        var parser = new xml2js.Parser();
        parser.parseString(data, function(err,result){
          //Extract the value from the data element
          createdTime = result.artiklar['skapad-tid'];
          //extractedData = result.artiklar.artikel[1].nr;
          connection.connect(function(err) {
            if (err) throw err;
            console.log('Inserting ' + result.artiklar.artikel.length + ' items!');
            for(var i = 0; i < result.artiklar.artikel.length; i++){
                var obj = result.artiklar.artikel[i];
                //console.log('INSERT: ' + ' ' + obj.nr + ' ' + obj.Namn + ' ' + obj.Prisinklmoms);
                post = {
                    number  : obj.nr,
                    name    : obj.Namn + ' ' + obj.Namn2,
                    price   : obj.Prisinklmoms,
                    type    : obj.Varugrupp,
                    subtype : obj.Typ,
                    origin  : obj.Ursprung,
                    country : obj.Ursprunglandnamn,
                    producer: obj.Producent,
                    alcohol : obj.Alkoholhalt,
                    date    : createdTime
                };
                connection.query("INSERT INTO data SET ?", post, function (err, result, fields) {
                if (err) throw err;
                //    console.log(result);
                });

            }
            connection.end();
          });

          //console.log(result.artiklar.artikel.length);
          console.log(createdTime);
          //console.log(extractedData);
        });
    });

});
