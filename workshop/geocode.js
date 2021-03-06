var language = 'en';  // change this if you want results in another language
var ss = SpreadsheetApp.getActiveSpreadsheet(),
    sheet = ss.getActiveSheet(),
    activeRange = ss.getActiveRange(),
    settings = {};

function forward(){
    getKey('forward');
}

function callAPI(query, key, country = null){
    // full API docs: https://opencagedata.com/api    
    var url = 'https://api.opencagedata.com/geocode/v1/json?query='
        + query
        + '&key=' + key;
        
    if (language){
        url += '&language=' + language;
    }

    if (country){
        url += '&countrycode=' + country;
    }

    // we don't need annotations so we turn them off
    // to make it slightly faster
    url += '&no_annotations=1';

    // more privacy
    url += '&no_record=1';
    
    var response = UrlFetchApp.fetch(url,{
        "headers" : {
            "Content-Type":"application/json",
            "Accept"      :"application/json"
        },
        muteHttpExceptions: true,
    });
    return response;
}

function error_txt(code){
    if (code == 402){
        return "free limit exceeded";
    }
    else if (code == 403){
        return "invalid API key";
    }
    return "error";
}

function getKey(gtype){
    var ui = SpreadsheetApp.getUi(); 

    var result = ui.prompt(
        '',
        'Please enter your OpenCage API key:',
        ui.ButtonSet.OK_CANCEL);

    var button = result.getSelectedButton();
    if (button == ui.Button.OK) {
        var APIkey = result.getResponseText();
        if (gtype == 'forward'){
            do_forward(APIkey);
        } else {
            do_reverse(APIkey);            
        }        
    } else if (button == ui.Button.CANCEL) { 
        ui.alert("without a valid OpenCage API key you can't geocode");
    } else if (button == ui.Button.CLOSE) {
        ui.alert("without a valid OpenCage API key you can't geocode");
    }
}

function do_forward(key){
    var sheet = SpreadsheetApp.getActiveSheet();
    var cells = sheet.getActiveRange();

    // Must have selected at least 3 columns (Address, Lat, Lng).
    // Must have selected at least 1 row.
    var columnCount = cells.getNumColumns();
    if (columnCount < 4) {
        var popup = SpreadsheetApp.getUi();
        popup.alert("Select at least four columns: Address in the leftmost column, followed by country code; the latitude, longitude will go into the next three columns.");
        return;
    }
  
    var addressRow;
    var addressColumn;
    var rowCount = cells.getNumRows();
      
    var latColumn = columnCount - 1; // Latitude  goes into the next-to-last col
    var lngColumn = columnCount; // Longitude goes into the last col
    var addresses = sheet.getRange(cells.getRow(), cells.getColumn(), rowCount, columnCount - 3).getValues();
    var countrycodes = sheet.getRange(cells.getRow(), cells.getColumn()+1, rowCount, columnCount - 2).getValues();
  
    // For each row of selected data...
    for (addressRow = 1; addressRow <= rowCount; ++addressRow) {
        var place = addresses[addressRow - 1].join(' ');
        var countrycode = String(countrycodes[addressRow - 1]).replace(',', '').toLowerCase();
        var popup = SpreadsheetApp.getUi();
        var response = callAPI(place, key, country = countrycode);
        var code = response.getResponseCode();
      
        if (code == '200'){
            var json = JSON.parse(response.getContentText());
            if (json){
                if (json.total_results >= 1){
                    lat = json.results[0].geometry.lat;
                    lng = json.results[0].geometry.lng;
                    cells.getCell(addressRow, latColumn).setValue(lat);
                    cells.getCell(addressRow, lngColumn).setValue(lng);
                }
            }
        } else {
            var etxt = error_txt(code);
            cells.getCell(addressRow, latColumn).setValue(null);
        }
    }      
}

function generateMenu(){
  return [{
    name: "Address to Latitude, Longitude",
    functionName: "forward"
  }];
}

function onOpen() {
    SpreadsheetApp.getActiveSpreadsheet().addMenu('Geocode', generateMenu());
}