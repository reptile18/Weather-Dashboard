$(document).ready(function () {
  // # Quick Reference
  // ## 5 Day Forecast by City
  // api.openweathermap.org/data/2.5/forecast?q={city name}&appid={your api key}
  /*
  
  */
  // ## Current
  // api.openweathermap.org/data/2.5/weather?q={city name}&appid={your api key}
  // Structure {
  /*     {
        "coord": {
          "lon": -117.16,   <---------------------------- Lon
          "lat": 32.72       <------------------------ Lat 
        },
        "weather": [
          {
            "id": 802,
            "main": "Clouds",
            "description": "scattered clouds",
            "icon": "03d"
          }
        ],
        "base": "stations",
        "main": {
          "temp": 293.83,         <------------- Temp
          "feels_like": 293.92,
          "temp_min": 291.48,
          "temp_max": 296.48,
          "pressure": 1017,
          "humidity": 64        <-------------------- Humidity
        },
        "visibility": 16093,
        "wind": {
          "speed": 1.5,          <------------------------ Wind Speed
          "deg": 230
        },
        "clouds": {
          "all": 40
        },
        "dt": 1588438661,               <---------------------- -D-A-T-E- TIME
        "sys": {
          "type": 1,
          "id": 5771,
          "country": "US",
          "sunrise": 1588424396,
          "sunset": 1588473061
        },
        "timezone": -25200,
        "id": 5391811,
        "name": "San Diego", <---------------------- City
        "cod": 200
        }
    } */
  // ## UV Index
  // http://api.openweathermap.org/data/2.5/uvi?appid={appid}&lat={lat}&lon={lon}
  /*
  {
  "lat": 38.75,
  "lon": 40.25,
  "date_iso": "2017-06-23T12:00:00Z",
  "date": 1498219200,
  "value": 10.16        <--------------- UV Index
    }
  */
  var openWeatherAPIKey = "79b83b610ed3f809e87dbad1878b15f9";
  var defaultCity = "San Diego";
  var queryWeather = "https://api.openweathermap.org/data/2.5/weather?appid=" + openWeatherAPIKey + "&q=";
  var queryUV = "http://api.openweathermap.org/data/2.5/uvi?appid=" + openWeatherAPIKey;
  var queryOneShot = "https://api.openweathermap.org/data/2.5/onecall?appid=" + openWeatherAPIKey;

  // variables
  var lat;
  var lon;
  var citiesHistory = [];

  // events
  $("#formCitySearch").submit(onFormCitySearchSubmit);
  $(document).on("click",".cityHistoryButton",onCityHistoryClick);

  function loadCities() {
    citiesHistory = JSON.parse(localStorage.getItem("citiesHistory"));
    if (citiesHistory === null) {
      citiesHistory = [];
    }
  }
  loadCities();

  function renderCitiesHistory() {
    $("#citiesHistoryList").empty();

    citiesHistory.forEach(function(city,i) {
      let cityButton = $("<button>").text(city).addClass("list-group-item list-group-item-action cityHistoryButton").attr("data-city",city);
      $("#citiesHistoryList").prepend(cityButton);
    });
  }
  renderCitiesHistory();

  function onCityHistoryClick(event) {
    let city = $(this).attr("data-city");
    renderCity(city);
  }

  function addCityToHistory(city) {
    if (!citiesHistory.includes(city)) {
      citiesHistory.push(city);
    }
    localStorage.setItem("citiesHistory",JSON.stringify(citiesHistory));
    renderCitiesHistory();
  }

  function onFormCitySearchSubmit(event) {
    event.preventDefault();
    var cityName = $("#inputCityName").val();
    renderCity(cityName);
  }

  function getWeatherIcon(weatherCode) {
    return "http://openweathermap.org/img/w/" + weatherCode + ".png";
  }

  function round2(number) {
    return Math.round(number * 100) / 100;
  }

  function getTempString(kelvin) {
    var celsius = kelvin - 273.15;
    var farhenheit = 1.8 * celsius + 32
    celsius = round2(celsius);
    farhenheit = round2(farhenheit);
    return farhenheit + "&deg;F (" + celsius + "&deg;C)"
  }

  function generateForecastDay(date, weather, weatherIcon, temp, humidity) {
    var forecastDayDiv = $("<div>").addClass("card bg-primary text-white p-3 text-center")
    var dateDiv = $("<div>").text(date).addClass("card-title font-weight-bold");
    var weatherIconDiv = $("<img>").attr("src", getWeatherIcon(weatherIcon)).attr("title", weather).addClass("weatherIcon mx-auto d-block");
    var tempDiv = $("<div>").html("Temp: " + getTempString(temp));
    var humidityDiv = $("<div>").text("Humidity : " + humidity);
    forecastDayDiv.append(dateDiv, weatherIconDiv, tempDiv, humidityDiv);
    return forecastDayDiv;
  }

  function renderCity(cityName) {
    var initWeatherQuery = queryWeather + cityName;
    $("#forecast5Day").empty();
    $.ajax({
      url: initWeatherQuery,
      method: "get"
    }).then(function (response) {
      // Get basic weather first
      var d = new Date().toLocaleDateString("en-US");
      $("#headerCityName").text(response.name + " (" + d + ")");
      addCityToHistory(response.name);
      $("#cityWeatherIcon").attr("src", getWeatherIcon(response.weather[0].icon)).attr("title",response.weather[0].main);
      $("#spanTemp").html(getTempString(response.main.temp));
      $("#spanHumid").text(response.main.humidity);
      $("#spanWind").text(response.wind.speed);
      lat = response.coord.lat;
      lon = response.coord.lon;

    }).then(function () {
      // get uv index
      $.ajax({
        url: queryUV + "&lat=" + lat + "&lon=" + lon,
        method: "get"
      }).then(function (response) {
        $("#spanUV").text(response.value);
      });
      // get daily forecast
      $.ajax({
        url: queryOneShot + "&lat=" + lat + "&lon=" + lon + "&exclude=current,hourly",
        method: "get"
      }).then(function (response) {
        let date;
        let weather;
        let weatherIcon;
        let temp;
        let humidity;
        for (let i = 1; i < 6; i++) {
          let element = response.daily[i];
          date = new Date(element.dt * 1000).toLocaleDateString("en-US");
          weather = element.weather[0].main;
          weatherIcon = element.weather[0].icon;

          temp = element.temp.day;
          humidity = element.humidity;
          let forecastDayDiv = generateForecastDay(date, weather, weatherIcon, temp, humidity);
          $("#forecast5Day").append(forecastDayDiv);
        }
        /*response.daily.forEach(function(element,index) {
          if 
          if (index > 0) {
            date = new Date(element.dt*1000).toLocaleDateString("en-US");
            weather = element.weather[0].main;
            weatherIcon = element.weather[0].icon;

            temp = element.temp.day;
            humidity = element.humidity;
            var forecastDayDiv = generateForecastDay(date,weather,weatherIcon,temp,humidity);
            $("#forecast5Day").append(forecastDayDiv);
          }
        });*/
      });

    });
  }
  if (citiesHistory.length > 0) {
    renderCity(citiesHistory[citiesHistory.length-1]);
  }
  //renderCity("San Diego");
});