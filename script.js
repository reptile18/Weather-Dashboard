$(document).ready(function () {

  var openWeatherAPIKey = "79b83b610ed3f809e87dbad1878b15f9";
  var defaultCity = "San Diego";
  var queryWeather = "https://api.openweathermap.org/data/2.5/weather?appid=" + openWeatherAPIKey + "&q=";
  var queryUV = "http://api.openweathermap.org/data/2.5/uvi?appid=" + openWeatherAPIKey;
  var queryOneShot = "https://api.openweathermap.org/data/2.5/onecall?appid=" + openWeatherAPIKey;

  // variables
  var lat;
  var lon;
  var citiesHistory = [];
  var tempinF = true;
  var currentCity;

  // events
  $("#CFCheckbox").click(function() {
    tempinF = !tempinF;
    console.log("tempInF?",tempinF)
    if (tempinF) {
      $("#spanCelsius").addClass("d-none");
      $("#spanFahrenheit").removeClass("d-none");
    }
    else {
      $("#spanFahrenheit").addClass("d-none");
      $("#spanCelsius").removeClass("d-none");
    }
    renderCity(currentCity);
  });
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
    if (tempinF) {
      return farhenheit + "&deg;F"
    }
    else {
      return celsius + "&deg;C"
    }
    
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
      $("#divRightPanel").removeClass("d-none");
      currentCity = response.name;
      $("#headerCityName").text(currentCity + " (" + d + ")");
      addCityToHistory(currentCity);
      
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
      });

    });
  }
  if (citiesHistory.length > 0) {
    renderCity(citiesHistory[citiesHistory.length-1]);
  }
});