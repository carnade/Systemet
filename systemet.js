var xml2js = require('xml2js');
var fs = require('fs');
var mysql = require('mysql');


var parser = new xml2js.Parser();

fs.readFile('data/test1.xml', function(err, data){
    parser.parseString(data, function(err,result){
      //Extract the value from the data element
      createdTime = result.artiklar['skapad-tid'];
      //extractedData = result.artiklar.artikel[1].nr;
      for(var i = 0; i < result.artiklar.artikel.length; i++){
          var obj = result.artiklar.artikel[i];
          console.log(obj.nr + ' ' + obj.Namn + ' ' + obj.Prisinklmoms);
      }
      //console.log(result.artiklar.artikel.length);
      console.log(createdTime);
      //console.log(extractedData);
    });
});
console.log("Note that you can't use value here if parseString is async; extractedData=", extractedData);
