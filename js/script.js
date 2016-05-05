$("document").ready(function(){
	
	$.validator.setDefaults({
		errorClass: 'errorMsg'
	});
	
	$("#forecastForm").validate({
		rules: {
      		street: {
        		required: true
      		},
      		city: {
        		required: true
      		},
      		state: {
        		required: true
      		},
    	},
    	messages: {
      		street: {
        		required: 'Please enter the street address'
      		},
	  		city: {
        		required: 'Please enter the city'
      		},
			state: {
        		required: 'Please select a state'
      		}
    	}
    });
	
	$("#forecastForm").submit(function(e){
    	var isvalidate=$("#forecastForm").valid();
    	if(!isvalidate) {
			e.preventDefault();
        } else {
			
			var data = $(this).serialize();
			$.ajax({
				type: "GET",
				dataType: "json",
				url: "forecastSearch.php",
				data: data,
				success: function(data) {
					populateData(data);
					createMap(data.latitude, data.longitude);
					console.log(data);
					
				}
			});
			return false;
		}
	});	
});

function populateData(data){
	
	populateTab1(data);
	populateTab2(data);
	populateTab3(data);

}

function populateTab1(data) {
	
	var citydetails = $('#city').val() + ", " + $('#state').val();
	
	var summary = data.currently.summary;
	var precipIntensity = data.currently.precipIntensity;
	var sunriseTime = moment.tz(data.daily.data[0].sunriseTime * 1000, data.timezone).format("hh:mm A");
    var sunsetTime = moment.tz(data.daily.data[0].sunsetTime * 1000, data.timezone).format("hh:mm A");
	var windSpeed = data.currently.windSpeed;
	var dewPoint = data.currently.dewPoint;
	
	var precipitation = "";
	var degreeUnit = 'F';
	var windSpeedUnit = "mph";
    var visibilityUnit = "mi";
	if($('input[name=temperature]:checked').val() === "si"){
		degreeUnit = 'C';
		windSpeedUnit = "m/s";
        visibilityUnit = "km";
        precipIntensity /= 25.4; 
	}
	
	var imageUrl = getSummaryIcon(data.currently.icon);
	var visibility = data.currently.visibility;
	if(visibility==NaN || visibility==undefined) {
		visibility = "N.A.";
		visibilityUnit = "";
	} else {
		visibility = Math.round(visibility);
	}
	
	if(precipIntensity>=0 && precipIntensity<0.002){precipitation="None";}
    else if(precipIntensity>=0.002 && precipIntensity<0.017){precipitation="Very Light";}
    else if(precipIntensity>=0.017 && precipIntensity<0.1){precipitation="Light";}
    else if(precipIntensity>=0.1 && precipIntensity<0.4){precipitation="Moderate";}
    else if(precipIntensity>=0.4){precipitation="Heavy";}
	
	$('.forecastResult').show();
	$('#weatherLogo').attr({src:"images/"+imageUrl, alt:summary, title:summary});
	
	$('#summary').text(summary + " in " + $('#city').val() + ", " + $('#state').val());
	$('#tempValue').html(Math.round(data.currently.temperature)+"<sup class='degClass'> &deg;"+degreeUnit+"</sup>");
	
$('#lowHigh').html("&nbsp;&nbsp;&nbsp;&nbsp;<span class='blue'>L: "+Math.round(data.daily.data[0].temperatureMin)+"&deg;</span> | <span class='green'> H: "+Math.round(data.daily.data[0].temperatureMax)+ "&deg;</span>");

	$('#precep').html(precipitation);
	$('#rainChance').html(Math.round(data.currently.precipProbability*100) + "&#37;");
	$('#speed').html(windSpeed.toFixed(2) + " " + windSpeedUnit);
	$('#dewPoint').html(dewPoint.toFixed(2) + "&deg; " + degreeUnit);
	$('#humidity').html(Math.round(data.currently.humidity*100) + "&#37;");
	
	$('#visibility').html(visibility + " " + visibilityUnit);
	$('#sunrise').html(sunriseTime);
	$('#sunset').html(sunsetTime);

	var temperature = (Math.round(data.currently.temperature))+"&deg;"+degreeUnit; 
	$("#fbPost").on("click", function(){
		postToFeed(citydetails, imageUrl, summary, temperature);
	});

}

function getTime(timeVar) {
	var dateObj = new Date(timeVar * 1000);
	var hours = dateObj.getHours();
	var min = dateObj.getMinutes();
	
	var suffix = (hours >= 12)? 'PM' : 'AM';
	hours = (hours > 12)? hours-12 : hours;
	hours = (hours == '00')? 12 : hours;
	
	hours = ('0' + hours).slice(-2);
	min = ('0' + min).slice(-2);
	
	return hours+":"+min+" "+suffix;
}

function getDay(timeVar) {
	var dateObj = new Date(timeVar * 1000);
	var day = dateObj.getDay();
	var obj = {
    	0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday"
	};
	return obj[day];
}

function getMonthDate(timeVar) {
	var dateObj = new Date(timeVar * 1000);
	var month = dateObj.getMonth();
	var date = dateObj.getDate();
	var obj = {
    	0: "Jan", 1: "Feb", 2: "Mar", 3: "Apr", 4: "May", 5: "Jun", 6: "Jul", 7: "Aug", 8: "Sep", 9: "Oct", 10: "Nov", 11: "Nov"
	};
	return obj[month] + " " + date;
}

function populateTab2(data) {
	var time;
	var degreeUnit = 'F';
	var windSpeedUnit = "mph";
    var visibilityUnit = "mi";
	var pressureUnit = "mb";
	if($('input[name=temperature]:checked').val() === "si"){
		degreeUnit = 'C';
		windSpeedUnit = "m/s";
        visibilityUnit = "km";
		pressureUnit = "hPa";
	}
	$('.tempSymbol').text(degreeUnit);
	$('.tab2Table').html("<tr><th>Time</th><th>Summary</th><th>Cloud Cover</th><th>Temp (&deg;<span class='tempSymbol'></span>)</th><th>View Details</th></tr>");
	for(var i=1; i<=24; i++){
		time = moment.tz(data.hourly.data[i].time * 1000, data.timezone).format("hh:mm A");
		summary = getSummaryIcon(data.hourly.data[i].icon);
		cloudCover = Math.round(data.hourly.data[i].cloudCover * 100);
		temperature = data.hourly.data[i].temperature;
		windSpeed = data.hourly.data[i].windSpeed;
		humidity = Math.round(data.hourly.data[i].humidity * 100);
		visibility = data.hourly.data[i].visibility;
		if(visibility==NaN || visibility==undefined) {
			visibility = "N.A.";
			visibilityUnit = "";
		}
		pressure = data.hourly.data[i].pressure;
		
		id = "#expandTable"+i;
		lastDataElemet = "<td><a href='"+id+"' data-toggle='collapse' class='glyphicon glyphicon-plus'></td>";
		
		$('.tab2Table').append("<tr><td>"+time+"</td><td><img class='smallImg' src=images/"+summary+"></td><td>"+cloudCover+"%</td><td>"+temperature.toFixed(2)+"</td>"+lastDataElemet+"</tr>");
		
		viewDetailsTable = "<div class='collapse expandDiv' id='expandTable"+i+"'><table class='table'><tr><th>Wind</th><th>Humidity</th><th>Visibility</th><th>Pressure</th></tr><tr><td>"+windSpeed+windSpeedUnit+"</td><td>"+humidity+"%</td><td>"+visibility+visibilityUnit+"</td><td>"+pressure+pressureUnit+"</td></tr></table></div>";
		
		$('.tab2Table').append("<tr class='grey'><td colspan=5>"+viewDetailsTable+"</td></tr>");
	}
}

function getSummaryIcon(iconStr){
	var imageUrl;
	switch(iconStr){
		case "clear-day" : imageUrl = "clear.png"; break;
		case "clear-night" : imageUrl="clear_night.png"; break;
        case "rain" : imageUrl="rain.png"; break;
        case "snow" : imageUrl="snow.png"; break;
        case "sleet" : imageUrl="sleet.png"; break;
        case "wind" : imageUrl="wind.png"; break;
        case "fog" : imageUrl="fog.png"; break;
        case "cloudy" : imageUrl="cloudy.png"; break;
        case "partly-cloudy-day" : imageUrl="cloud_day.png"; break;
        case "partly-cloudy-night" : imageUrl="cloud_night.png"; break;
	}
	return imageUrl;
}

function populateTab3(data){
	var degreeUnit = 'F';
	var windSpeedUnit = "mph";
    var visibilityUnit = "mi";
	var pressureUnit = "mb";
	if($('input[name=temperature]:checked').val() === "si"){
		degreeUnit = 'C';
		windSpeedUnit = "m/s";
        visibilityUnit = "km";
		pressureUnit = "hPa";
	}
	$('#tab3Data').html("");
	for(var i=1; i<data.daily.data.length; i++){
		day = getDay(data.daily.data[i].time);
		monthDate = getMonthDate(data.daily.data[i].time);
		summary = getSummaryIcon(data.daily.data[i].icon);
		minTemp = data.daily.data[i].temperatureMin;
		maxTemp = data.daily.data[i].temperatureMax;
		visibility = data.daily.data[i].visibility;
		if(visibility==NaN || visibility==undefined) {
			visibility = "N.A.";
			visibilityUnit = "";
		}
		
		var sunriseTime = moment.tz(data.daily.data[i].sunriseTime * 1000, data.timezone).format("hh:mm A");
		var sunsetTime = moment.tz(data.daily.data[i].sunsetTime * 1000, data.timezone).format("hh:mm A");
		
		popupHtml = "<div class='modal' id='popupInfo"+i+"' tabindex=-1>";
		popupHtml += "<div class='modal-dialog'>";
		popupHtml += "<div class='modal-content'>";
		popupHtml += "<div class='modal-header'><button type='button' class='close' data-dismiss='modal'><span>&times;</span></button><h5 class='modalHeader modal-title'>Weather in "+$('#city').val()+" on "+monthDate+"</h5></div>";
		popupHtml += "<div class='modal-body'>";
		popupHtml += "<p><img class='largeImage' src='images/"+summary+"'></p>";
		popupHtml += "<p class='popupSummary'>"+day+": <span class='orange'>"+data.daily.data[i].summary+"</span></p>";
		popupHtml += "<div class='row'>";
		popupHtml += "<div class='col-md-4'><p><b>Sunrise Time</b><br>"+sunriseTime+"</p></div>";
		popupHtml += "<div class='col-md-4'><p><b>Sunset Time</b><br>"+ sunsetTime+"</p></div>";
		popupHtml += "<div class='col-md-4'><p><b>Humidity</b><br>"+Math.round(data.daily.data[i].humidity * 100)+"%</p></div>";
		popupHtml += "</div>";
		popupHtml += "<div class='row'>";
		popupHtml += "<div class='col-md-4'><p><b>Windspeed</b><br>"+data.daily.data[i].windSpeed + windSpeedUnit+"</p></div>";
		popupHtml += "<div class='col-md-4'><p><b>Visibility</b><br>"+visibility + visibilityUnit+"</p></div>";
		popupHtml += "<div class='col-md-4'><p><b>Pressure</b><br>"+data.daily.data[i].pressure + pressureUnit+"</p></div>";
		popupHtml += "</div>";
		popupHtml += "</div>";
		popupHtml += "<div class='modal-footer'><button type='button' data-dismiss='modal' class='btn btn-default'>Close</button>"
		
		popupHtml += "</div></div></div>";
		
		
		tab3Html = "<div class='col-lg-1 col-md-1 col-sm-1 col-xs-12'><button type='button' class='btn btn-block marginDiv' data-toggle='modal' data-target='#popupInfo"+i+"' id='divDay"+i+"'><div class='summaryClass'>"+day+"</div><br><div class='summaryClass'>"+monthDate+"</div><br><div><img class='img-responsive center-block imageSize' src='images/"+summary+"'></div><br><div class='whiteText'>Min<br>Temp</div><br><div class='tempClass'>"+Math.round(minTemp)+"&deg;</div><br><div class='whiteText'>Max<br>Temp</div><br><div class='tempClass'>"+Math.round(maxTemp)+"&deg;</div></button></div>";
		
		
		$('#tab3Data').append(tab3Html);
		$('#tab3Data').append(popupHtml);
	}
}

function createMap(lat, lon){
	$('#openMap').html(" ");
    var map = new OpenLayers.Map("openMap");
    var fromProjection = new OpenLayers.Projection("EPSG:4326");
    var toProjection = new OpenLayers.Projection("EPSG:900913");
    var position = new OpenLayers.LonLat(lon, lat).transform(fromProjection, toProjection);
    // Create overlays OSM
    var mapnik = new OpenLayers.Layer.OSM();
    var layer_cloud = new OpenLayers.Layer.XYZ("clouds", "http://${s}.tile.openweathermap.org/map/clouds/${z}/${x}/${y}.png",
		{
			isBaseLayer: false,
			opacity: 0.7,
			sphericalMercator: true
		}
	);

	var layer_precipitation = new OpenLayers.Layer.XYZ("precipitation", "http://${s}.tile.openweathermap.org/map/precipitation/${z}/${x}/${y}.png",
		{
			isBaseLayer: false,
			opacity: 0.7,
			sphericalMercator: true
		}
	);
    map.addLayers([mapnik, layer_precipitation, layer_cloud]);
    map.setCenter(position, 18);
}

function postToFeed(citydetails, icon, summary, temperature) {
	FB.ui({
		method: 'feed',
		'link': "http://forecast.io",
		'picture': 'http://cs-server.usc.edu:45678/hw/hw8/images/' + icon,
		'name': "Current Weather at " + citydetails,
		'description': '' + summary + "\, "+ temperature 
		
	}, function(response) {
		if (response && response.post_id) {
			alert("Posted Successfully");
		} else {
			alert("Not Posted");
		} 
	});
 }

window.fbAsyncInit = function() {
    FB.init({
      appId      : '894368990659552', 
      xfbml      : true,
      version    : 'v2.5'
    });
  };

  (function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "//connect.facebook.net/en_US/all.js";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));