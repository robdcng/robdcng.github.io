var Matrix = function() {
    var matrix = this;

    this.insert = function(i,j,value){
        if(!matrix[i]) {
            matrix[i] = {};
        }

        matrix[i][j] = value;
    }

    this.getValue = function(i,j){
        if(matrix[i]){
            return matrix[i][j] || null;
        }

        return null;
    }
}

var MarkerMatrix = function(){
    var matrix = new Matrix();

    for(var latitude = -90; latitude <= 90; latitude++){
        for(var longitude = -180; longitude <= 180; longitude++){
            matrix.insert(latitude,longitude,{});
        }
    }

    return matrix;
}

var MarkerFactory = function(){
    this.createMarker = function(device){

        return {
            id : device.id,
            latitude : device.status.location.latitude,
            longitude : device.status.location.longitude,
            name : device.name,
            label : device.status.flags ? 'F' : 'L',
        }
    }
}

var DeviceMarkerView = function(options) {
    var deviceMarker = this;
    this.device = options.device;
    this.marker = new google.maps.Marker(options.markerOptions);

    this.addClickHandler = function(callback) {
        google.maps.event.addListener(deviceMarker.marker, 'click', callback);
    };
}

var MapView = function(element) {
    this.googleMap = new google.maps.Map(element, {
        center: new google.maps.LatLng(33.808678, -117.918921),
        zoom: 5,
        minZoom: 5
    });

    this.addClickHandler = function(callback) {
        google.maps.event.addListener(this.googleMap, 'click', callback);
    },

    this.addEventHandler = function(event,callback){
        google.maps.event.addListener(this.googleMap, event, callback);
    }
};

var AppView = Backbone.View.extend({
    markers: {},
    initialize: function(options) {
        this.activeMarkers = [];
        this.markerMatrix = new MarkerMatrix();
        this.markers = options.markers || {};

        for (var i = this.markers.length - 1; i >= 0; i--) {
            var device = this.markers[i];
            var lat = Math.trunc(device.status.location.latitude);
            var lng = Math.trunc(device.status.location.longitude);

            var value = this.markerMatrix.getValue(lat,lng);
            value[device.id] = device;
        };
    },
    infoWindow: new google.maps.InfoWindow(),
    getDevices: function(bounds) {
        var devices = {};
        var neLat = Math.trunc(bounds.getNorthEast().lat());
        var swLat = Math.trunc(bounds.getSouthWest().lat());
        var neLng = Math.trunc(bounds.getNorthEast().lng());
        var swLng = Math.trunc(bounds.getSouthWest().lng());

        for(var lng = swLng; lng <= neLng; lng++){
            for(var lat = swLat; lat <= neLat; lat++){
                devices = $.extend(devices,this.markerMatrix.getValue(lat,lng));
            }
        }

        return devices;
    },
    addMapMarker: function(map, device) {
        var app = this;
        var label = device.status.flags ? 'F' : 'L';

        var markerView = new DeviceMarkerView({
            device: device,
            markerOptions: {
                position: new google.maps.LatLng(device.status.location.latitude, device.status.location.longitude),
                map: map,
                label: label
            }
        })

        return markerView;
    },
    addMarkerListener: function(map, marker, device) {
        var app = this;

        google.maps.event.addListener(marker, 'click', function() {
            var content = app.deviceDetailTemplate()({
                name: device.name,
                latitude: device.status.location.latitude,
                longitude: device.status.location.longitude
            });

            app.infoWindow.open(map, marker);
            app.infoWindow.setContent(content);
        })
    },
    deviceDetailTemplate: function(device) {
        return _.template('<ul style="list-style-type: none;"><li>name: <%= name %></li><li>longitude: <%= longitude %></li><li>latitude: <%= latitude %></li></ul>');
    },
    removeMarkers: function(map,markers) {
        _.each(markers,function(value){
           value.marker.setMap(null);
        })

        this.activeMarkers = [];
    },
    updateMarkers: function(map){
        var app = this;
        var bounds = map.getBounds();
        var devices = app.getDevices(bounds);

        app.removeMarkers(map,app.activeMarkers);

        _.each(devices,function(device){
            var markerView = app.addMapMarker(map,device);
            app.addMarkerListener(map,markerView.marker,markerView.device);
            app.activeMarkers.push(markerView);
        });

        console.log(Object.keys(devices).length);
    },
    run: function() {
        var app = this;
        var mapView = new MapView(app.$el[0]);

        mapView.addEventHandler('click',(function(infoWindow) {
            return function() {
                infoWindow.close();
            }
        })(app.infoWindow));

        google.maps.event.addListenerOnce(mapView.googleMap, 'bounds_changed', function(){
            app.updateMarkers(mapView.googleMap);
        });

        mapView.addEventHandler('dragend',function(){
            app.updateMarkers(mapView.googleMap);
        })

        mapView.addEventHandler('zoomed',function(){
            app.updateMarkers(mapView.googleMap);
        })
    }
})




$.getJSON({
    url: 'https://connect­-staging.blacklinegps.com/1/device?access_token=ebe92e686f6683e10336',
}).then(function(response){

    var app = new AppView({
        el: Backbone.$('#map'),
        markers: response
    });

    app.run();
})



