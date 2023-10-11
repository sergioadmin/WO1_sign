var map;
const grades = [0, 50, 100, 250, 500, 1000];
const colors =['green', 'yellow', 'orange', 'violet', 'blue', 'red'];
const sizes=[2,4,5,7,9,13];

const tgWO = new Map();

var osmLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors. Інвентаризація 2021'
});

googleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
  maxZoom: 20,
  subdomains:['mt0','mt1','mt2','mt3'], 
  attribution: 'Google Satellite. Інвентаризація 2021'
});

var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/  MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community. Інвентаризація 2021'
});

map = L.map('map', {
  center: new L.LatLng(48.0,37.62),
  zoom: 8,
  maxZoom: 18,
  layers: [osmLayer]
});

var baseMaps = {
  "OpenStreetMap": osmLayer,
  "Esri_WorldImagery": Esri_WorldImagery,
  "Google_Sat": googleSat
};

// var layers = {},
      // cultureLayer = L.layerGroup(),
  layerCtrl = L.control.layers(baseMaps);
  var layer_adm = L.geoJSON(my_geojson, {
    filter: function(feature) {
      create_hash(feature);
      return (feature.properties.id > 100);
    }
  }).bindPopup(function (layer) {
    count = tgWO.get(Number(layer.feature.properties.id));
      return layer.feature.properties.ADMIN_3+" "+layer.feature.properties.TYPE+'<br />'+layer.feature.properties.ADMIN_2+'<br />'+(count>0 ? 'Кількість водних об\'єктів: <b> <FONT COLOR="RED">'+count+'</b> </FONT COLOR="RED">' : '');
    }).addTo(map);
  
layer_adm.setStyle({fillColor :'#f7941d', fillOpacity: 0.2,"weight": 1, color: 'red'});
  
layer_WO_centroids_1 = new L.geoJson(json_WO_centroids_2, {
  attribution: '',
  interactive: true,
  dataVar: 'json_WO_centroids_2',
  layerName: 'layer_WO_centroids_1',
  pointToLayer: function (feature, latlng) {
      var marker = L.circleMarker(latlng, {
      radius: 4.0,
      opacity: 1,
      color: 'rgba(35,35,35,1.0)',
      dashArray: '',
      lineCap: 'butt',
      lineJoin: 'miter',
      weight: 1,
      fill: true,
      fillOpacity: 1,
      fillColor: 'rgba(165,187,248,1.0)',
      interactive: true,
      riseOnHover: true,
      riseOffset: 250,
    });
    countWO(feature);
    return marker;  
  },
  onEachFeature: onEachDot_s
});

map.addLayer(layer_WO_centroids_1);

layer_WO_centroids_2 = new L.geoJson(json_WO_centroids_2, {
  attribution: '',
  interactive: true,
  dataVar: 'json_WO_centroids_2',
  layerName: 'layer_WO_centroids_2',
  pointToLayer: function (feature, latlng) {
    return L.circleMarker(latlng, style(feature));
  },
  onEachFeature: onEachDot
});

var overlayMaps = {
  "Однакові": layer_WO_centroids_1,
  "Масштабні": layer_WO_centroids_2
};
map.addLayer(layer_WO_centroids_2);

var groupedOverlays = {
  "Об'ємні позначки": overlayMaps
};

var options = {
  exclusiveGroups: ["Об'ємні позначки"],
  groupCheckboxes: false
};
  
L.control.groupedLayers(baseMaps, groupedOverlays, options).addTo(map);

  // Add fuse search control
  var options = {
    position: 'topright',
    title: 'Пошук по: ID, назві, населеному пункту',
    placeholder: 'ID, назва, населений пункт',
    maxResultLength: 15,
    threshold: 0.5,
    showInvisibleFeatures: true,
    showResultFct: function(feature, container) {
        props = feature.properties;
        var name = L.DomUtil.create('b', null, container);
        name.innerHTML = props.ID;
        container.appendChild(L.DomUtil.create('br', null, container));
        var info = '' + props.WO_name + ', ' + props.city_name;
        container.appendChild(document.createTextNode(info));
    }
  };

  // $("#map").height($(window).height()).width($(window).width());
  // map.invalidateSize();

  var fuseSearchCtrl = L.control.fuseSearch(options);
  map.addControl(fuseSearchCtrl);

  var props = ['ID', 'WO_name', 'city_name'];
  fuseSearchCtrl.indexFeatures(json_WO_centroids_2.features, props);

  // });
   
    //create circle color legend
var mylegend = L.control({
  position: 'bottomright'
});

//generate legend contents
mylegend.onAdd = function (map) {
  var div = L.DomUtil.create('div', 'info legend'),
  labels = ['<strong>Об\'єм, тис. м<sup>3</sup></strong>'];
  labels.push('<table class="legend_table">');
  for (var i = 0; i < grades.length; i++) {
      from = grades[i];
      to = grades[i + 1];
      sr = ' <tr> \
             <td>'+'<i class="colorcircle" style="background:' + colors[i] + '; width: '+sizes[i]*2+'px; height: '+sizes[i]*2 + 'px; border-radius: 50%;' +'"></i> '+'</td>\
             <td>'+from + (to ? '&ndash;' + to  + '<br>' : '+')+'</td>\
             </tr>';
    labels.push(sr);
  }
  labels.push('</table>');
  div.innerHTML = labels.join('');
  return div;
};
mylegend.addTo(map);


map.on('overlayadd', function(eventLayer){
  if (eventLayer.name === "Масштабні"){
      map.addControl(mylegend);
  } 
});

map.on('overlayremove', function(eventLayer){
  if (eventLayer.name === "Масштабні"){
       map.removeControl(mylegend);
  } 
});

function displayFeatures1(feature, layer) {

    var popup = L.DomUtil.create('div', 'tiny-popup', map.getContainer());
                    
    // for (var id in features) {
        var feat = feature.properties.id;
        var cat = pop_WO_centroids_2();
        // console.log(cat);
        // var cat = feat.properties.id;
        var site = L.geoJson(feat, {
            pointToLayer: function(feature, latLng) {
                // var icon = icons[cat];
                var icon = icons[1];
                // L.circleMarker(latlng, style_WO_centroids_2_0(feature))
                var marker = L.marker(latLng, {
                    icon: icon,
                    keyboard: false,
                    riseOnHover: true
                });
                if (! L.touch) {
                    marker.on('mouseover', function(e) {
                        var nom = e.target.feature.properties.WO_name;
                        var pos = map.latLngToContainerPoint(e.latlng);
                        // popup.innerHTML = nom;
                        popup.innerHTML = pop_WO_centroids_2();
                        L.DomUtil.setPosition(popup, pos);
                        L.DomUtil.addClass(popup, 'visible');

                    }).on('mouseout', function(e) {
                        L.DomUtil.removeClass(popup, 'visible');
                    });
                }
                return marker;
            },
        });
}

function style_WO_centroids_2_0() {
    return {
        // pane: 'pane_WO_centroids_2',
        radius: 4.0,
        opacity: 1,
        color: 'rgba(35,35,35,1.0)',
        dashArray: '',
        lineCap: 'butt',
        lineJoin: 'miter',
        weight: 1,
        fill: true,
        fillOpacity: 1,
        fillColor: 'rgba(165,187,248,1.0)',
        interactive: true,
    }
}

function getColor(v) {
  vv=Number(v.replace(/,/g, '.'));
  if(isNaN(vv)) return 'grey'; // not number
  if(vv>grades[grades.length-1]) return colors[grades.length-1];
  for (var i = 0; i < grades.length-1; i++) {
    from = grades[i];
    to = grades[i + 1];
    if(vv>from && vv<=to) return colors[i];
  }
}

function getRadius(v) {
  vv=Number(v.replace(/,/g, '.'));
  if(isNaN(vv)) return 26; // not number
  // if(vv>grades[5]) sizes[5];
  if(vv>grades[grades.length-1]) return sizes[grades.length-1];
  for (var i = 0; i < grades.length-1; i++) {
     from = grades[i];
     to = grades[i + 1];
     if(vv>from && vv<=to) return sizes[i];
  }
}

//create style, with fillColor picked from color ramp and radius calculated from size
function style_s(feature) {
  return {
    radius: 4.0,
    opacity: 1,
    color: 'rgba(35,35,35,1.0)',
    dashArray: '',
    lineCap: 'butt',
    lineJoin: 'miter',
    weight: 1,
    fill: true,
    fillOpacity: 1,
    fillColor: 'rgba(165,187,248,1.0)',
    interactive: true,
    riseOnHover: true,
    riseOffset: 250

  };
}

function highlightStyle_s(feature) {
  return {
      radius: 5.5,
    fillColor: "#102040",
    color: "#116",
      weight: 1,
    opacity: 1,
    fillOpacity: 0.9
  };
}

//create style, with fillColor picked from color ramp and radius calculated from size
function style(feature) {
  return {
      radius: getRadius(feature.properties.value),
      fillColor: getColor(feature.properties.value),
      color: "#000",
      weight: 1,
      opacity: 0,
      fillOpacity: 0.8
  };
}
//create highlight style, with darker color and larger radius
function highlightStyle(feature) {
  return {
      radius: getRadius(feature.properties.value)+1.5,
    fillColor: "#102040",
    color: "#116",
      weight: 1,
    opacity: 1,
    fillOpacity: 0.9
  };
}

function highlightDot_s(e) {
  var layer = e.target;
  dotStyleHighlight = highlightStyle_s(layer.feature);
  layer.setStyle(dotStyleHighlight);
  if (!L.Browser.ie && !L.Browser.opera) {
      layer.bringToFront();
  }
}
function resetDotHighlight_s(e) {
  var layer = e.target;
  dotStyleDefault = style_s(layer.feature);
  layer.setStyle(dotStyleDefault);
}

//attach styles and popups to the marker layer
function highlightDot(e) {
  var layer = e.target;
  dotStyleHighlight = highlightStyle(layer.feature);
  layer.setStyle(dotStyleHighlight);
  if (!L.Browser.ie && !L.Browser.opera) {
      layer.bringToFront();
  }
}
function resetDotHighlight(e) {
  var layer = e.target;
  dotStyleDefault = style(layer.feature);
  layer.setStyle(dotStyleDefault);
}

function onEachDot_s(feature, layer) {
  layer.on({
      mouseover: highlightDot_s,
      mouseout: resetDotHighlight_s
  });
  layer.bindPopup(getPopupContent(feature, layer), {maxHeight: 270});
}
  function onEachDot(feature, layer) {
    layer.on({
        mouseover: highlightDot,
        mouseout: resetDotHighlight
    });
    
  layer.bindPopup(getPopupContent(feature, layer), {maxHeight: 270});

}

function getPopupContent(feature, layer) {
  feature.layer = layer;
  
  var props = feature.properties;
  if (props) {
    var title1 = '';
    ss=props['WO_name'].trim().toUpperCase();
    if( props['WO_name'].trim().toUpperCase() === 'ставок'.toUpperCase() && 
        props['Type_gydro'].trim().toUpperCase()==='ставок'.toUpperCase()
      ) { title1 = 'Ставок (без назви)'; }
    else if (props['WO_name'].trim().toUpperCase() === 'озеро'.toUpperCase() && 
             props['Type_gydro'].trim().toUpperCase()==='озеро'.toUpperCase())
             title1 = 'Озеро (без назви)';
    else if (props['WO_name'].trim().toUpperCase() === 'озеро'.toUpperCase() && 
             props['Type_gydro'].trim().toUpperCase()!='озеро'.toUpperCase())
             {title1 =  "Озеро "+props.WO_name;}
    else if (props['Type_gydro'].trim().toUpperCase()==='водосховище'.toUpperCase())
             {title1 =  "Водосховище "+props.WO_name;}
    else {title1 = props.Type_gydro+" "+props.WO_name;}
          
    // var popupContent = '<h3> <i>'+title1+'</h3> </i>'+'<table class="my_table">\
    var popupContent = '<strong> <i>'+title1+'</strong> </i>'+'<table class="my_table">\
      <tr>\
        <td class="name_row"> ID</td>\
        <td class="row_value">' + feature.properties['ID'] + '</td>\
      </tr>\
      <tr>\
        <td class="name_row"> Площа водного дзеркала при НПР, га</td>\
        <td class="row_value">' + feature.properties['Площа водного дзеркала при НПР_ га'] + '</td>\
      </tr>\
      <tr>\
        <td class="name_row"> Об\'єм при НПР, тис.м3</td>\
        <td class="row_value">' + feature.properties['value'] + '</td>\
      </tr>\
      <tr>\
        <td class="name_row"> Населений пункт</td>\
        <td class="row_value">' + feature.properties['city_name'] + '</td>\
      </tr>\
      <tr>\
        <td class="name_row"> Район</td>\
        <td class="row_value">' + feature.properties['Район'] + '</td>\
      </tr>\
      <tr>\
        <td class="name_row"> Територіальна громада</td>\
        <td class="row_value">' + feature.properties['tg_name'] + '</td>\
      </tr>\
      <tr>\
        <td class="name_row"> Назва ВО</td>\
        <td class="row_value">' + feature.properties['WO_name'] + '</td>\
      </tr>\
      <tr>\
        <td class="name_row"> Тип гідрографії</td>\
        <td class="row_value">' + feature.properties['Type_gydro'] + '</td>\
      </tr>\
      <tr>\
        <td class="name_row"> Тип ВО</td>\
        <td class="row_value">' + feature.properties['Тип водного об\'єкта'] + '</td>\
      </tr>\
      <tr>\
        <td class="name_row"> Назва водотоку, на якому розташовано ВО (басейн річки)</td>\
        <td class="row_value">' + feature.properties['Назва водотоку_ на якому розташовано водний об\'єкт_ басейн річки'] + '</td>\
      </tr>\
      <tr>\
        <td class="name_row"> Суббасейн</td>\
        <td class="row_value">' + feature.properties['Суббасейн'] + '</td>\
      </tr>\
      <tr>\
        <td class="name_row"> Район річкового басейну</td>\
        <td class="row_value">' + feature.properties['Район річкового басейну'] + '</td>\
      </tr>\
      <tr>\
        <td class="name_row"> Код водогосподарської ділянки</td>\
        <td class="row_value">' + feature.properties['Водогосподарська ділянка _код_'] + '</td>\
      </tr>\
      <tr>\
        <td class="name_row"> Паспорт водного об’єкта (дата погодження)</td>\
        <td class="row_value">' + feature.properties['Паспорт водного об\'єкта _дата погодження_'] + '</td>\
      </tr>\
      <tr>\
        <td class="name_row"> Паспорт рибогосподарської технологічної водойми  (дата погодження)</td>\
        <td class="row_value">' + feature.properties['Паспорт рибогосподарської технологічної водойми _дата погодження_'] + '</td>\
      </tr>\
      <tr>\
        <td class="name_row"> Форма власності ГТС</td>\
        <td class="row_value">' + feature.properties['Форма власності гідротехнічної споруди'] + '</td>\
      </tr>\
      <tr>\
        <td class="name_row"> Форма власності ГТС</td>\
        <td class="row_value">' + feature.properties['Форма власності гідротехнічної споруди'] + '</td>\
      </tr>\
      <tr>\
        <td class="name_row"> Балансоутримувач\/орендар\/власник ГТС</td>\
        <td class="row_value">' + feature.properties['Балансоутримувач_орендар_власник гідротехнічної споруди'] + '</td>\
      </tr>\
      <tr>\
        <td class="name_row"> Стан ГТС (задовільний\/незадовільний\/аварійний)</td>\
        <td class="row_value">' + feature.properties['Стан гідротехнічної споруди (задовільний_незадовільний_аварійний)'] + '</td>\
      </tr>\
      <tr>\
        <td class="name_row"> Можливість регулювання стоку</td>\
        <td class="row_value">' + feature.properties['Можливість регулювання стоку'] + '</td>\
      </tr>\
      <tr>\
        <td class="name_row"> Кадастровий номер земельної ділянки під ВО</td>\
        <td class="row_value">' + feature.properties['Кадастровий номер земельної ділянки під водним об\'єктом'] + '</td>\
      </tr>\
      <tr>\
        <td class="name_row"> Форма власності на ділянку</td>\
        <td class="row_value">' + feature.properties['Форма власності на ділянку'] + '</td>\
      </tr>\
      <tr>\
        <td class="name_row"> Користувач ділянки під ВО</td>\
        <td class="row_value">' + feature.properties['Користувач ділянки під водним об\'єктом'] + '</td>\
      </tr>\
      <tr>\
        <td class="name_row"> Орендар ВО</td>\
        <td class="row_value">' + feature.properties['Орендар водного об\'єкта'] + '</td>\
      </tr>\
      <tr>\
        <td class="name_row"> Орендодавець</td>\
        <td class="row_value">' + feature.properties['Орендодавець'] + '</td>\
      </tr>\
      <tr>\
        <td class="name_row"> Номер договору, за яким орендується ВО, період дії</td>\
        <td class="row_value">' + feature.properties['Номер договору_ за яким орендується водний об\'єкт_ період дії'] + '</td>\
      </tr>\
    </table>';
    return popupContent;
  }
}

function create_hash(feature) {
  // console.log(feature.ADMIN_2);
  // region = feature.properties.ADMIN_2;
  // tg = feature.properties.ADMIN_3;
  id = feature.properties.id;
  tgWO.set(id,0);
  // console.log(tgWO.size);
}

function countWO(feature) {
  id_tg = feature.properties.id_tg;
  count = tgWO.get(Number(id_tg));
  // console.log('typeof id_tg='+typeof(id_tg));
  // console.log('typeof count='+typeof(count));
  // console.log(count+ '       '+ tgWO.size);
  // console.log(id_tg +'   '+ count);
  tgWO.set(Number(id_tg), count+1);
}