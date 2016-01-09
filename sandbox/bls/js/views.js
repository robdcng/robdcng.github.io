


var DeviceMarkerView = function(options){
    var deviceMarker = this;
    this.device = options.device;
    this.marker  = new google.maps.Marker(options.markerOptions);

    this.addClickHandler = function(callback){
        google.maps.event.addListener(deviceMarker.marker,'click',callback)
    };
}

var MapView = function(element){
    this.googleMap = new google.maps.Map(element, {
            center: new google.maps.LatLng(33.808678, -117.918921),
            zoom: 3,
            minZoom: 6
    });

    this.addClickHandler = function(callback){
        console.log(callback);
        google.maps.event.addListener(this.googleMap,'click',callback)
    }
};

var AppView = Backbone.View.extend({
    initialize: function(options){
        this.markers = markers;
    },
    infoWindow : new google.maps.InfoWindow(),
    addMapMarker: function(map, device){
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
    addMarkerListener: function(map,marker,device){
        var app = this;

        google.maps.event.addListener(marker,'click',function(){
            var content = app.deviceDetailTemplate()({name: device.name,latitude: device.status.location.latitude,longitude: device.status.location.longitude});

            app.infoWindow.open(map, marker);
            app.infoWindow.setContent(content);
        })
    },
    deviceDetailTemplate: function(device){
        return _.template('<ul style="list-style-type: none;"><li>name: <%= name %></li><li>longitude: <%= longitude %></li><li>latitude: <%= latitude %></li></ul>');
    },
    run: function(){
        var app = this;

        var mapView = new MapView(app.$el[0]);

        google.maps.event.addListener(mapView.googleMap,'click',function(){
            app.infoWindow.close();
        })

        mapView.addClickHandler((function(infoWindow){
            return function(){
                infoWindow.close();
            }
        })(app.infoWindow));

        for(var i = 0 ; i < markers.length; i++) {
            var device = markers[i]

            var markerView = app.addMapMarker(mapView.googleMap,device);
            // app.addMarkerListener(mapView.googleMap,markerView.marker,markerView.device);

            markerView.addClickHandler((function(map,markerView,device){

                return function(){
                    alert();
                }
            })(mapView.googleMap,markerView,device));

        }
    }
})

