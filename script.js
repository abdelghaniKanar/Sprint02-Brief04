const API_KEY = "ab4a484a4b1c1d7b95e905bd41487608";
let favorites = JSON.parse(localStorage.getItem("weatherFavorites")) || [];

// DOM Elements
const searchInput = document.getElementById("searchInput");
const currentDate = document.getElementById("current-date");
const cityLocation = document.getElementById("location");
const weatherIcon = document.getElementById("weather-icon");
const temperature = document.getElementById("temperature");
const windSpeed = document.getElementById("wind-speed");
const humidity = document.getElementById("humidity");
const hourlyList = document.getElementById("hourly-list");
const weeklyList = document.getElementById("weekly-list");
const favoritesList = document.getElementById("favorites-list");
const addFavoriteBtn = document.getElementById("add-favorite");

// Weather icons mapping
const weatherIcons = {
  Clear: "fa-sun-o",
  Clouds: "fa-cloud",
  Rain: "fa-rain",
  Snow: "fa-snowflake-o",
  Thunderstorm: "fa-bolt",
  Drizzle: "fa-cloud-rain",
  Mist: "fa-smog",
};

// Get user's location
function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        getWeatherByCoords(latitude, longitude);
      },
      (error) => {
        // Fallback to default city
        alert("Geolocation error:", error);
        getCurrentWeather("rabat");
      }
    );
  } else {
    // Fallback to default city
    alert("Geolocation is not supported");
    getCurrentWeather("rabat");
  }
}

// Fetch weather by coordinates
async function getWeatherByCoords(lat, lon) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
    const data = await response.json();
    updateCurrentWeather(data);
    getForecastByCoords(lat, lon);
  } catch (error) {
    alert("Error fetching weather by coordinates:", error);
  }
}

// Fetch forecast by coordinates
async function getForecastByCoords(lat, lon) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
    const data = await response.json();
    updateHourlyForecast(data.list.slice(0, 5));
    updateWeeklyForecast(data.list);
  } catch (error) {
    alert("Error fetching forecast by coordinates:", error);
  }
}

// Fetch current weather by city name
async function getCurrentWeather(city) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
    );
    const data = await response.json();
    updateCurrentWeather(data);
    getForecast(city);
  } catch (error) {
    console.error("Error fetching current weather:", error);
  }
}

// Fetch forecast by city name
async function getForecast(city) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
    );
    const data = await response.json();
    updateHourlyForecast(data.list.slice(0, 5));
    updateWeeklyForecast(data.list);
  } catch (error) {
    console.error("Error fetching forecast:", error);
  }
}

function updateCurrentWeather(data) {
  // Round the temperature to nearest whole number
  const temp = Math.round(data.main.temp);

  // Change the body class based on temperature
  // If temp > 20°C: no class (warm/default theme)
  // If temp <= 20°C: 'cold' class (cold theme)
  document.body.className = temp > 20 ? "" : "cold";

  // Create and format the current date string
  // Example output: "mon, jan 23, 2025 -- 12:00 pm"
  currentDate.textContent = new Date()
    .toLocaleString("en-US", {
      weekday: "short", // Mon, Tue, etc.
      month: "short", // Jan, Feb, etc.
      day: "numeric", // 1-31
      year: "numeric", // 2025
      hour: "2-digit", // 01-12
      minute: "2-digit", // 00-59
      hour12: true, // Use 12-hour format (AM/PM)
    })
    .toLowerCase(); // Convert to lowercase for styling

  // Update the basic weather information
  cityLocation.textContent = data.name; // City name
  temperature.textContent = temp; // Temperature
  windSpeed.textContent = Math.round(data.wind.speed); // Wind speed
  humidity.textContent = data.main.humidity; // Humidity

  // This line maps a weather condition (e.g., Clear, Clouds, etc.) from the API (data.weather[0].main)
  // to a corresponding Font Awesome icon class defined in the weatherIcons object.
  const iconClass = weatherIcons[data.weather[0].main] || "fa-sun-o";
  // Update the weather icon HTML
  weatherIcon.innerHTML = `<i class="fa ${iconClass}"></i>`;
}

//Updates the hourly forecast section of the UI
function updateHourlyForecast(hourlyData) {
  // Transform the hourly data array into HTML string
  hourlyList.innerHTML = hourlyData
    .map((hour) => {
      // Convert Unix timestamp (seconds) to milliseconds for Date object
      const hourTime = new Date(hour.dt * 1000).getHours();

      return `
                <div class="hour">
                    <div class="time">${hourTime}:00</div>
                    <div class="temp">${Math.round(hour.main.temp)}°C</div>
                    <div class="condition">${hour.weather[0].main.toLowerCase()}</div>
                </div>
            `;
    })
    .join(""); // Convert array to string by joining with empty string
}

//Updates the weekly forecast section of the UI
function updateWeeklyForecast(forecastData) {
  // Filter data to get only readings at 12:00 PM (noon) each day
  // This gives us one reading per day for the weekly forecast
  const dailyData = forecastData.filter((item) =>
    item.dt_txt.includes("12:00:00")
  );

  // Transform the daily data array into HTML string
  weeklyList.innerHTML = dailyData
    .map((day) => {
      // Convert Unix timestamp to readable date
      const dayDate = new Date(day.dt * 1000);

      return `
                <div class="day">
                    <span>${dayDate.toLocaleDateString("en-US", {
                      weekday: "long", // Full weekday name (Monday, Tuesday, etc.)
                    })}</span>
                    <span>temp: ${Math.round(day.main.temp)}°C</span>
                    <span>wind: ${Math.round(day.wind.speed)} mps</span>
                    <span>hum: ${day.main.humidity}%</span>
                </div>
            `;
    })
    .join(""); // Convert array to string
}

//Adds a city to the favorites list
function addToFavorites(city) {
  // Check if city is already in favorites
  if (!favorites.includes(city)) {
    // Add city to favorites array
    favorites.push(city);
    // Save updated favorites to localStorage
    localStorage.setItem("weatherFavorites", JSON.stringify(favorites));
    // Update the favorites list in the UI
    updateFavoritesList();
  } else {
    alert("City exists in favorites");
  }
}

//Removes a city from the favorites list
function removeFromFavorites(city) {
  // Filter out the specified city from favorites array
  // we create new array with only the cities not equal to the deleted
  favorites = favorites.filter((fav) => fav !== city);
  // Save updated favorites to localStorage
  localStorage.setItem("weatherFavorites", JSON.stringify(favorites));
  // Update the favorites list in the UI
  updateFavoritesList();
}

// Updates the favorites list in the UI
function updateFavoritesList() {
  // Transform favorites array into HTML string
  favoritesList.innerHTML = favorites
    .map(
      (city) => `
            <div class="favorite">
                <!-- City name is clickable and loads weather data -->
                <span onclick="getCurrentWeather('${city}')">${city}</span>
                <!-- Delete button with trash icon -->
                <button class="delete-btn" onclick="removeFromFavorites('${city}')">
                    <i class="fa fa-trash"></i>
                </button>
            </div>
        `
    )
    .join("");
}

// Event listeners
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    getCurrentWeather(e.target.value);
  }
});

addFavoriteBtn.addEventListener("click", () => {
  const city = cityLocation.textContent;
  addToFavorites(city);
});

// Initialize app with user's location
getUserLocation();
updateFavoritesList();
