let searchHistory = [];
let weatherApiRootUrl = "https://api.openweathermap.org";
let weatherApiKey = "dbbfe158553c69c8ce23905282dab783";

let searchForm = document.querySelector("#search-form");
let searchInput = document.querySelector("#search-input");
let todayContainer = document.querySelector("#today");
let forecastContainer = document.querySelector("#forecast");
let searchHistoryContainer = document.querySelector("#history");

dayjs.extend(window.dayjs_plugin_utc);
dayjs.extend(window.dayjs_plugin_timezone);

function renderSearchHistory() {
  searchHistoryContainer.innerHTML = "";

  for (let i = searchHistory.length - 1; i >= 0; i--) {
    let btn = document.createElement("button");
    btn.setAttribute("type", "button");
    btn.setAttribute("aria-controls", "today forecast");
    btn.classList.add("history-btn", "btn-history");

    btn.setAttribute("data-search", searchHistory[i]);
    btn.textContent = searchHistory[i];
    searchHistoryContainer.append(btn);
  }
}

function appendToHistory(search) {
  if (searchHistory.indexOf(search) !== -1) {
    return;
  }
  searchHistory.push(search);

  localStorage.setItem("search-history", JSON.stringify(searchHistory));
  renderSearchHistory();
}
function initSearchHistory() {
  let storedHistory = localStorage.getItem("search-history");
  if (storedHistory) {
    searchHistory = JSON.parse(storedHistory);
  }
  renderSearchHistory();
}

function renderCurrentWeather(city, weather, timezone) {
  let date = dayjs().tz(timezone).format("M/D/YYYY");

  let tempF = weather.temp;
  let windMph = weather.wind_speed;
  let humidity = weather.humidity;
  let uvi = weather.uvi;
  let iconUrl = `https://openweathermap.org/img/w/${weather.weather[0].icon}.png`;
  let iconDescription = weather.weather[0].description || weather[0].main;

  let card = document.createElement("div");
  let cardBody = document.createElement("div");
  let heading = document.createElement("h2");
  let weatherIcon = document.createElement("img");
  let tempEl = document.createElement("p");
  let windEl = document.createElement("p");
  let humidityEl = document.createElement("p");
  let uvEl = document.createElement("p");
  let uviIndicator = document.createElement("button");

  card.setAttribute("class", "card");
  cardBody.setAttribute("class", "card-body");
  card.append(cardBody);

  heading.setAttribute("class", "h3 card-title");
  tempEl.setAttribute("class", "card-text");
  windEl.setAttribute("class", "card-text");
  humidityEl.setAttribute("class", "card-text");

  heading.textContent = `${city} (${date})`;
  weatherIcon.setAttribute("src", iconUrl);
  weatherIcon.setAttribute("alt", iconDescription);
  weatherIcon.setAttribute("class", "weather-img");
  heading.append(weatherIcon);
  tempEl.textContent = `Temp: ${tempF}°F`;
  windEl.textContent = `Wind: ${windMph} MPH`;
  humidityEl.textContent = `Humidity: ${humidity} %`;
  cardBody.append(heading, tempEl, windEl, humidityEl);

  uvEl.textContent = "UV Index: ";
  uviIndicator.classList.add("btn", "btn-sm");

  if (uvi < 3) {
    uviIndicator.classList.add("btn-success");
  } else if (uvi < 7) {
    uviIndicator.classList.add("btn-warning");
  } else {
    uviIndicator.classList.add("btn-danger");
  }

  uviIndicator.textContent = uvi;
  uvEl.append(uviIndicator);
  cardBody.append(uvEl);

  todayContainer.innerHTML = "";
  todayContainer.append(card);
}

function renderForecastCard(forecast, timezone) {
  let unixTs = forecast.dt;
  let iconUrl = `https://openweathermap.org/img/w/${forecast.weather[0].icon}.png`;
  let iconDescription = forecast.weather[0].description;
  let tempF = forecast.temp.day;
  let { humidity } = forecast;
  let windMph = forecast.wind_speed;

  let col = document.createElement("div");
  let card = document.createElement("div");
  let cardBody = document.createElement("div");
  let cardTitle = document.createElement("h5");
  let weatherIcon = document.createElement("img");
  let tempEl = document.createElement("p");
  let windEl = document.createElement("p");
  let humidityEl = document.createElement("p");

  col.append(card);
  card.append(cardBody);
  cardBody.append(cardTitle, weatherIcon, tempEl, windEl, humidityEl);

  col.setAttribute("class", "col-md");
  col.classList.add("five-day-card");
  card.setAttribute("class", "card bg-primary h-100 text-white");
  cardBody.setAttribute("class", "card-body p-2");
  cardTitle.setAttribute("class", "card-title");
  tempEl.setAttribute("class", "card-text");
  windEl.setAttribute("class", "card-text");
  humidityEl.setAttribute("class", "card-text");

  cardTitle.textContent = dayjs.unix(unixTs).tz(timezone).format("M/D/YYYY");
  weatherIcon.setAttribute("src", iconUrl);
  weatherIcon.setAttribute("alt", iconDescription);
  tempEl.textContent = `Temp: ${tempF} °F`;
  windEl.textContent = `Wind: ${windMph} MPH`;
  humidityEl.textContent = `Humidity: ${humidity} %`;

  forecastContainer.append(col);
}

function renderForecast(dailyForecast, timezone) {
  let startDt = dayjs().tz(timezone).add(1, "day").startOf("day").unix();
  let endDt = dayjs().tz(timezone).add(6, "day").startOf("day").unix();

  let headingCol = document.createElement("div");
  let heading = document.createElement("h4");

  headingCol.setAttribute("class", "col-12");
  heading.textContent = "5-Day Forecast:";
  headingCol.append(heading);

  forecastContainer.innerHTML = "";
  forecastContainer.append(headingCol);
  for (let i = 0; i < dailyForecast.length; i++) {
    if (dailyForecast[i].dt >= startDt && dailyForecast[i].dt < endDt) {
      renderForecastCard(dailyForecast[i], timezone);
    }
  }
}

function renderItems(city, data) {
  renderCurrentWeather(city, data.current, data.timezone);
  renderForecast(data.daily, data.timezone);
}

// Fetches weather data for given location from the Weather Geolocation
// endpoint; then, calls functions to display current and forecast weather data.
function fetchWeather(location) {
  let { lat } = location;
  let { lon } = location;
  let city = location.name;
  let apiUrl = `${weatherApiRootUrl}/data/2.5/onecall?lat=${lat}&lon=${lon}&units=imperial&exclude=minutely,hourly&appid=${weatherApiKey}`;

  fetch(apiUrl)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      renderItems(city, data);
    })
    .catch(function (err) {
      console.error(err);
    });
}

function fetchCoords(search) {
  let apiUrl = `${weatherApiRootUrl}/geo/1.0/direct?q=${search}&limit=5&appid=${weatherApiKey}`;

  fetch(apiUrl)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      if (!data[0]) {
        alert("Location not found");
      } else {
        appendToHistory(search);
        fetchWeather(data[0]);
      }
    })
    .catch(function (err) {
      console.error(err);
    });
}

function handleSearchFormSubmit(e) {
  if (!searchInput.value) {
    return;
  }

  e.preventDefault();
  let search = searchInput.value.trim();
  fetchCoords(search);
  searchInput.value = "";
}

function handleSearchHistoryClick(e) {
  if (!e.target.matches(".btn-history")) {
    return;
  }

  let btn = e.target;
  let search = btn.getAttribute("data-search");
  fetchCoords(search);
}

initSearchHistory();
searchForm.addEventListener("submit", handleSearchFormSubmit);
searchHistoryContainer.addEventListener("click", handleSearchHistoryClick);
