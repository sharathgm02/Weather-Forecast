<?php

	header("Access-Control-Allow-Origin: *");
	header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");

	if($_GET["street"]&&$_GET["city"]&&$_GET["state"]){
		header('Content-Type: application/json');
		
		$return;
		$location = $_GET["street"].",".$_GET["city"].",".$_GET["state"];
		$coordinatesArray = lookup($location);
		$forecastJson;
		if($coordinatesArray!=null){
        	$forecastJson = getWeatherInfo($coordinatesArray);
        }
		echo $forecastJson;
	}

	function lookup($string){
    	$googleApiKeyParam = "AIzaSyCUSFlLAuiQIEQmGO6CQQB65WmLFb-KUE0";
        $string = str_replace(" ", "+", urlencode($string));
        $url = "https://maps.google.com/maps/api/geocode/xml?address=".$string."&key=".$googleApiKeyParam;
    
        $xmlObject = simplexml_load_file($url);
        if($xmlObject->status == "OK"){
        	$location = $xmlObject->result[0]->geometry->location;
            $coordinatesArray = array($location->lat, $location->lng);
            return $coordinatesArray;
      	}
        if($xmlObject->status == "OVER_QUERY_LIMIT"){
        	echo "<h2 class='red alignCenter'> You have exceeded the usage limits for the day. </h2>";
            return null;
        }
        echo "<h2 class='red alignCenter'>Address not found. <br> Enter a valid address.</h2>";
        	return null;
	}

	function getWeatherInfo($array){
    	$apiKeyParam = "23dc3c33a51e3777f1a3a4047a349ea6";
        $excludeParam = "flags";
        $latitude = $array[0];
        $longitude = $array[1];
        $unit = $_GET["temperature"];
        $forecastURL = "https://api.forecast.io/forecast/".$apiKeyParam."/".$latitude.",".$longitude."?units=".$unit."&exclude=".$excludeParam;
            
		$jsonResult = file_get_contents($forecastURL);
		
        return $jsonResult;
	}

?>