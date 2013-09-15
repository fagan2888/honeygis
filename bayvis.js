var m = null;
var lastlg = null;

function initmap() {
  m = L.map("map").setView([37.8202, -122.2801],12);

  L.tileLayer("http://otile{s}.mqcdn.com/tiles/1.0.0/{type}/{z}/{x}/{y}.png",
    {subdomains: '1234',type:'map',minZoom:10,maxZoom:16}).addTo(m);
}

function colormap(data,config) {

var nodes = data[config["csvfname"]];
          
var points = [];
nodes.forEach(function(node) {
    points.push([+node.y, +node.x, +node[config["field"]]]);
});

var buckets = config["buckets"];
var radius = config["radius"];

var hexbin = d3.hexbin()
    .size([
    	d3.max(points,function(v){return v.x})-d3.min(points,function(v){return v.x}), 
    	d3.max(points,function(v){return v.y})-d3.min(points,function(v){return v.y})])
    .radius(radius);

var hex = hexbin(points);

function myave(h) {return config["agg"](h,function(v){return v[2]});}

if(config["quantile"] == true) {
    var q = d3.scale.quantile()
        .domain(hex.map(function(h){return myave(h)})
        .reduce(function(a,b){if(a.indexOf(b)===-1){a.push(b)};return a;},[])
        .sort(function(a,b){return a-b}))
        .range(d3.range(buckets));
} else {
  var q = d3.scale.quantize()
      .domain(d3.extent(hex.map(function(h){return myave(h)})))
      .range(d3.range(buckets));
}

function hexagon(radius) {
    var x0 = 0, y0 = 0;
    return d3.range(0, 2 * Math.PI, Math.PI / 3).map(function(angle) {
      var x1 = Math.sin(angle) * radius,
          y1 = -Math.cos(angle) * radius,
          dx = x1 - x0,
          dy = y1 - y0;
      x0 = x1, y0 = y1;
      return [dx, dy];
    });
};

var transform = hexagon(radius);

transform.shift();
 
if(lastlg != null) m.removeLayer(lastlg);

var lg = L.layerGroup(hex.map(function(h) {
	return L.polygon(transform.map(function(t){
		return [h.x+t[0],h.y+t[1]];
	}),{
		stroke:false,
		color:colorbrewer[config["colorscheme"]][buckets][(buckets-1)-q(myave(h))],
		fillOpacity:config["opacity"]
	}).bindPopup("Agg value: "+myave(h).toFixed(2));
}));

lastlg = lg;
lg.addTo(m);

}
