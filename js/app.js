// vars for baidu maps API
var map;
var markers = [];
var infoWindows = [];


// local data
var markerData = [
{
    name: '首义公园',
    position: {lat: 114.31918, lng: 30.54731},
    foursquareID: '5019184ce4b0425069d13dd7'
},
{
    name: '黄鹤楼',
    position: {lat: 114.309052, lng: 30.550239},
    foursquareID: '53750c15498e0ba4ee67b464'
},
{
    name: '武昌江滩',
    position: {lat: 114.305768, lng: 30.561713},
    foursquareID: '515fc94ce4b0605d23ec1da4'
},
{
    name: '武汉长江大桥',
    position: {lat: 114.294757, lng: 30.555483},
    foursquareID: '54bc467b498ef55d20755a05'
},
{
    name: '昙华林',
    position: {lat: 114.317489, lng: 30.558105},
    foursquareID: '4d9fde5bbb206ea8be1cd0fd'
},
{
    name: '辛亥革命武昌起义纪念馆',
    position: {lat: 114.312353, lng: 30.547045},
    foursquareID: '54430b66498e7ca8b92f0010'
}
];

// markerData2 is for creating myViewModel.markers (an observable array), so when it get cleared, markerData remains for later use
var markerData2 = [];
var populateMarkerData2 = function() {
    for (var x in markerData) {
        markerData2.push(markerData[x]);
    }
};
populateMarkerData2();


// init Baidu Map API
function initMap(){
	map = new BMap.Map('map');
	
	var point = new BMap.Point(114.317489,30.558105);
	map.centerAndZoom(point,16);
	
	// create markers and info windows
	for (var i = 0; i < markerData.length; i++){
		// create marker
		var pointForMarker = new BMap.Point(markerData[i].position.lat,markerData[i].position.lng);  // revert the lat and lng 
		
		var marker = new BMap.Marker(pointForMarker);
		
		
		// add info window
	var contentString = 'Sorry, the data can\'t be loaded now.'; // show when ajax request doesn't work.
	var infoWindow = new BMap.InfoWindow(contentString);
	
	// use IIFE to deal with closure problem
	marker.addEventListener('click',(function(markerCopy,infoWindowCopy){
		return function(){
			closeInfoWindows();
			markerCopy.openInfoWindow(infoWindowCopy);
			toggleBounceOffAll();
			toggleBounceOn(markerCopy);
		};
	})(marker,infoWindow));
	
	// show the marker at first
	toggleOn(marker);
	// push marker into markers array
	markers.push(marker);
	//push infoWindow into infoWindows array
	infoWindows.push(infoWindow);
	};
}


// functions to toggle marker's visibility
var toggleOff = function(marker) {
    map.removeOverlay(marker);
};
var toggleOn = function(marker) {
    map.addOverlay(marker);
};
var toggleOffAll = function() {
    for (var x in markers) {
        map.removeOverlay(markers[x]);
    }
};

// function to close all info windows
var closeInfoWindows = function() {
    map.closeInfoWindow();
};

// functions to toggle markers' BOUNCE animation
var toggleBounceOffAll = function() {
    for (var x in markers) {
        markers[x].setAnimation(null);
    }
};

var toggleBounceOn = function(marker) {
    marker.setAnimation(BMAP_ANIMATION_BOUNCE);
    
    setTimeout(function(){marker.setAnimation(null)},3000); //stop the bounce
};

// knockout view-model
var myViewModel = {
    // data
    markers: ko.observableArray(markerData2),
    searchValue: ko.observable(''),

    // operations
    search: function(value) {
        //remove all the current markers, which removes them from the view
        myViewModel.markers.removeAll();
        toggleOffAll();

        for (var x in markerData) {
            if (markerData[x].name.indexOf(value) >= 0) {
                myViewModel.markers.push(markerData[x]);
                toggleOn(markers[x]);
            }
        }
    },
    listClick: function(value) {
        // close all info windows, toggle all bounce animation off
        closeInfoWindows();
        toggleBounceOffAll();

        for (var x in markerData) {
            if (markerData[x].name.indexOf(value.name) >= 0) {
                //open info window and toggle bounce animation on for the clicked
                markers[x].openInfoWindow(infoWindows[x]);
                toggleBounceOn(markers[x]);
            }
        }
    }
};

ko.applyBindings(myViewModel);

// Explicitly subscribing to observables
myViewModel.searchValue.subscribe(myViewModel.search);

var alertCount = true;

// get foursquare data
for (var x in markerData) {

    var url = 'https://api.foursquare.com/v2/venues/' +
            markerData[x].foursquareID +
            '?client_id=FNMHOGTDEWE10PGKTEBDW5IYWTXLFJKJFH4G232RV3ZEVCVO' +
            '&client_secret=3PFR1W2WZYV5RAP3TSCCYUOXIE5CJSKJSPPFBJUXQDFKORH2' +
            '&v=20160105';

    $.getJSON(url, (function(xCopy){ // IIFE
        return function(data) {
            // use returned JSON here
            markerData[xCopy].foursquareData = data;
            var venue = data.response.venue;

            // create contentString
            var contentString0 = '<div><h4>' + venue.name + '</h4><h5>';
            var contentString2;
            if (venue.rating !== undefined) {
                contentString2 = '</h5><div><span>' + venue.location.formattedAddress[0] + '</span>, <span>' +
                    venue.location.formattedAddress[1] + '</span></div><br><div>Rating: <span>' + venue.rating +
                    '</span>/10 Based on <span>' + venue.ratingSignals + '</span> votes</div></div>';
            } else {
                contentString2 = '</h5><div><span>' + venue.location.formattedAddress[0] + '</span>, <span>' +
                    venue.location.formattedAddress[1] + '</span></div><br><div>Rating not available</div></div>';
            }
            var contentString1 = '';
            var categories = venue.categories;
            for (var i=0; i < categories.length; i++) {
                contentString1 += '<span>' + categories[i].name + '</span>, ';
            }
            // delete last two positions of contentString1
            contentString1 = contentString1.slice(0, -2);

            var contentString = contentString0 + contentString1 + contentString2;

            // change info windows' content
            infoWindows[xCopy].setContent(contentString);

        };
    })(x)).fail(function(){ // error handling
        if (alertCount === true) {
        alert("Sorry, some data can't be loaded now. Please try later.");
        alertCount = false; // make sure it only alert once
        }
    });

}

var mapError = function() {
    alert("Sorry, Baidu Maps API can't be loaded now. Please try later.");
    alertCount = false;
};