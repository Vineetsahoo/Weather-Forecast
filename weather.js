const apikey = "ccc67bbdfcc940da5f1c90095b41cdef";
const apiurl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const forecastUrl = "https://api.openweathermap.org/data/2.5/forecast?units=metric&q=";
const airQualityUrl = "https://api.openweathermap.org/data/2.5/air_pollution?";
const moonPhaseUrl = "https://api.openweathermap.org/data/2.5/onecall?";

// DOM element references
const searchBox = document.querySelector(".search input");
const searchBtn = document.querySelector(".search-btn");
const locationBtn = document.querySelector(".location-btn");
const favoritesBtn = document.querySelector(".favorites-btn");
const weatherIcon = document.querySelector(".weather-icon");
const loaderElement = document.querySelector(".loader");
const themeToggle = document.getElementById("theme-toggle");
const historyList = document.querySelector(".history-list");
const forecastContainer = document.querySelector(".forecast-container");
const hourlyContainer = document.querySelector(".hourly-container");
const favoritesPanel = document.querySelector(".favorites-panel");
const closePanel = document.querySelector(".close-panel");
const favoritesList = document.querySelector(".favorites-list");
const favoriteToggle = document.querySelector(".favorite-toggle");
const unitBtns = document.querySelectorAll(".unit-btn");
const closeAlert = document.querySelector(".close-alert");
const weatherAlert = document.querySelector(".weather-alert");
const weatherMap = document.getElementById("weather-map");

// NEW: DOM elements for new features
const moonCircle = document.querySelector(".moon-circle");
const moonPhaseName = document.querySelector(".moon-phase-name");
const moonPhaseDate = document.querySelector(".moon-phase-date");
const moonIllumination = document.querySelector(".moon-illumination");
const uvIndicator = document.querySelector(".uv-indicator");
const uvValue = document.querySelector(".uv-value span");
const uvAdvice = document.querySelector(".uv-advice");
const compassArrow = document.querySelector(".compass .arrow");
const windDirection = document.querySelector(".wind-direction");
const windSpeedCompass = document.querySelector(".wind-speed-compass");
const windGust = document.querySelector(".wind-gust");
const precipitationChart = document.querySelector(".chart-bars");
const precipitationLabels = document.querySelector(".chart-labels");
const precipitationSummary = document.querySelector(".precipitation-summary");
const compareCityInput = document.getElementById("compare-city");
const compareBtn = document.getElementById("compare-btn");
const comparisonResults = document.querySelector(".comparison-results");

// Initialize storage arrays
let searchHistory = JSON.parse(localStorage.getItem("weatherSearchHistory")) || [];
let favoriteLocations = JSON.parse(localStorage.getItem("favoriteLocations")) || [];
let currentCity = "";
let currentUnit = "metric";

// Update date and time
function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById("current-date").textContent = now.toLocaleDateString('en-US', options);
    document.getElementById("current-time").textContent = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    // Update sun position if weather data is loaded
    if (document.querySelector(".weather").style.display === "block") {
        updateSunPosition();
    }
}

// Update sun position based on current time relative to sunrise/sunset
function updateSunPosition() {
    const sunPosition = document.querySelector(".sun-position");
    const now = new Date();
    const sunriseTime = document.querySelector(".sunrise-time span").textContent;
    const sunsetTime = document.querySelector(".sunset-time span").textContent;
    
    // Convert to Date objects for comparison
    const sunrise = new Date();
    const [sunriseHours, sunriseMinutes] = sunriseTime.split(":");
    sunrise.setHours(parseInt(sunriseHours), parseInt(sunriseMinutes.split(" ")[0]), 0);
    
    const sunset = new Date();
    const [sunsetHours, sunsetMinutes] = sunsetTime.split(":");
    sunset.setHours(parseInt(sunsetHours), parseInt(sunsetMinutes.split(" ")[0]), 0);
    
    // Calculate position as percentage of day
    const totalDayTime = sunset - sunrise;
    const currentDayTime = now - sunrise;
    let percentage = (currentDayTime / totalDayTime) * 100;
    
    // Keep within bounds
    percentage = Math.max(0, Math.min(percentage, 100));
    
    // Update position
    sunPosition.style.left = `${percentage}%`;
    
    // Update visual appearance based on day/night
    if (now < sunrise || now > sunset) {
        document.querySelector(".sun-path").classList.add("night");
    } else {
        document.querySelector(".sun-path").classList.remove("night");
    }
}

// Update time every second
setInterval(updateDateTime, 1000);
updateDateTime();

// Dark mode toggle
themeToggle.addEventListener("change", () => {
    if (themeToggle.checked) {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
    } else {
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("theme", "light");
    }
});

// Check for saved theme preference
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
    themeToggle.checked = true;
    document.documentElement.setAttribute("data-theme", "dark");
}

// Unit conversion toggle
unitBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        if (!btn.classList.contains("active")) {
            // Toggle active class
            unitBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            // Update unit
            currentUnit = btn.dataset.unit;
            
            // Refresh weather data if a city is selected
            if (currentCity) {
                checkWeather(currentCity);
            }
        }
    });
});

// Open/close favorites panel
favoritesBtn.addEventListener("click", () => {
    favoritesPanel.classList.toggle("active");
    updateFavoritesList();
});

closePanel.addEventListener("click", () => {
    favoritesPanel.classList.remove("active");
});

// Toggle favorite status
favoriteToggle.addEventListener("click", () => {
    if (currentCity) {
        const isFavorite = favoriteLocations.includes(currentCity);
        
        if (isFavorite) {
            // Remove from favorites
            favoriteLocations = favoriteLocations.filter(city => city !== currentCity);
            favoriteToggle.innerHTML = '<i class="fa-regular fa-heart"></i>';
            favoriteToggle.title = "Add to favorites";
        } else {
            // Add to favorites
            favoriteLocations.push(currentCity);
            favoriteToggle.innerHTML = '<i class="fa-solid fa-heart"></i>';
            favoriteToggle.title = "Remove from favorites";
        }
        
        // Save to localStorage
        localStorage.setItem("favoriteLocations", JSON.stringify(favoriteLocations));
        updateFavoritesList();
    }
});

// Close weather alert
closeAlert.addEventListener("click", () => {
    weatherAlert.style.display = "none";
});

// Update favorites list in panel
function updateFavoritesList() {
    favoritesList.innerHTML = "";
    
    if (favoriteLocations.length === 0) {
        favoritesList.innerHTML = '<p class="no-favorites">No favorite locations yet. Add some by clicking the heart icon when viewing a location.</p>';
        return;
    }
    
    favoriteLocations.forEach(city => {
        const favoriteItem = document.createElement('div');
        favoriteItem.className = 'favorite-item';
        favoriteItem.innerHTML = `
            <span>${city}</span>
            <button class="remove-favorite" data-city="${city}">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;
        favoriteItem.addEventListener('click', (e) => {
            if (!e.target.closest('.remove-favorite')) {
                searchBox.value = city;
                checkWeather(city);
                favoritesPanel.classList.remove("active");
            }
        });
        favoritesList.appendChild(favoriteItem);
    });
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-favorite').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const city = btn.dataset.city;
            favoriteLocations = favoriteLocations.filter(item => item !== city);
            localStorage.setItem("favoriteLocations", JSON.stringify(favoriteLocations));
            updateFavoritesList();
            
            // Update heart icon if current city was removed
            if (city === currentCity) {
                favoriteToggle.innerHTML = '<i class="fa-regular fa-heart"></i>';
                favoriteToggle.title = "Add to favorites";
            }
        });
    });
}

// Get weather by geolocation
locationBtn.addEventListener("click", () => {
    if (navigator.geolocation) {
        loaderElement.style.display = "flex";
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const geoUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${apikey}`;
                
                fetch(geoUrl)
                    .then(response => response.json())
                    .then(data => {
                        currentCity = data.name;
                        updateWeatherUI(data);
                        getForecast(data.name, lat, lon);
                        getAirQuality(lat, lon);
                        updateWeatherMap(lat, lon);
                        addToSearchHistory(data.name);
                    })
                    .catch(() => {
                        showError();
                    });
            },
            () => {
                loaderElement.style.display = "none";
                alert("Unable to retrieve your location. Please allow location access.");
            }
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }
});

// Update weather UI function
function updateWeatherUI(data) {
    document.querySelector(".city").innerHTML = data.name;
    currentCity = data.name;
    
    // Temperature with unit
    const tempUnit = currentUnit === "metric" ? "°C" : "°F";
    document.querySelector(".temp").innerHTML = Math.round(data.main.temp) + tempUnit;
    document.querySelector(".feels-like").innerHTML = "Feels like: " + Math.round(data.main.feels_like) + tempUnit;
    
    // Other metrics
    document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
    
    // Wind speed with appropriate unit
    const windSpeed = currentUnit === "metric" 
        ? data.wind.speed + " km/h" 
        : (data.wind.speed * 2.237).toFixed(1) + " mph";
    document.querySelector(".wind").innerHTML = windSpeed;
    
    document.querySelector(".pressure").innerHTML = data.main.pressure + " hPa";
    document.querySelector(".visibility").innerHTML = (data.visibility / 1000) + " km";
    document.querySelector(".weather-description").innerHTML = data.weather[0].description;
    
    // Update sunrise/sunset times
    const sunriseTime = new Date(data.sys.sunrise * 1000).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    const sunsetTime = new Date(data.sys.sunset * 1000).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    document.querySelector(".sunrise-time span").textContent = sunriseTime;
    document.querySelector(".sunset-time span").textContent = sunsetTime;
    
    // Weather recommendations based on conditions
    updateWeatherRecommendation(data.weather[0].main, data.main.temp);
    
    // Update favorite toggle button
    if (favoriteLocations.includes(data.name)) {
        favoriteToggle.innerHTML = '<i class="fa-solid fa-heart"></i>';
        favoriteToggle.title = "Remove from favorites";
    } else {
        favoriteToggle.innerHTML = '<i class="fa-regular fa-heart"></i>';
        favoriteToggle.title = "Add to favorites";
    }
    
    // Weather icon and background
    if (data.weather[0].main == "Clouds") {
        weatherIcon.src = "images/clouds.png";
        document.body.className = "clouds-bg";
    }
    else if (data.weather[0].main == "Clear") {
        weatherIcon.src = "images/clear.png";
        document.body.className = "clear-bg";
    }
    else if (data.weather[0].main == "Rain") {
        weatherIcon.src = "images/rain.png";
        document.body.className = "rain-bg";
    }
    else if (data.weather[0].main == "Drizzle") {
        weatherIcon.src = "images/drizzle.png";
        document.body.className = "rain-bg";
    }
    else if (data.weather[0].main == "Mist") {
        weatherIcon.src = "images/mist.png";
        document.body.className = "mist-bg";
    }
    else {
        weatherIcon.src = "images/clouds.png";
        document.body.className = "";
    }
    
    // Check for extreme weather alerts
    if (data.weather[0].main === "Thunderstorm" || 
        data.weather[0].main === "Tornado" || 
        data.main.temp > 40 || 
        data.main.temp < -10 ||
        data.wind.speed > 20) {
        
        showWeatherAlert(data);
    } else {
        weatherAlert.style.display = "none";
    }

    // Update sun position
    updateSunPosition();

    // NEW: Update wind direction compass
    if (data.wind && data.wind.deg !== undefined) {
        updateWindCompass(data.wind.deg, data.wind.speed, data.wind.gust);
    }
    
    loaderElement.style.display = "none";
    document.querySelector(".weather").style.display = "block";
    document.querySelector(".search-history").style.display = "block";
}

// Show weather alert
function showWeatherAlert(data) {
    let alertMessage = "Weather alert: ";
    
    if (data.weather[0].main === "Thunderstorm") {
        alertMessage += "Thunderstorms in the area. Stay indoors.";
    } else if (data.weather[0].main === "Tornado") {
        alertMessage += "Tornado warning! Seek shelter immediately.";
    } else if (data.main.temp > 40) {
        alertMessage += "Extreme heat warning. Stay hydrated.";
    } else if (data.main.temp < -10) {
        alertMessage += "Extreme cold warning. Limit outdoor exposure.";
    } else if (data.wind.speed > 20) {
        alertMessage += "High wind advisory. Secure loose objects.";
    }
    
    document.querySelector(".alert-text").textContent = alertMessage;
    weatherAlert.style.display = "flex";
}

// Update weather recommendation
function updateWeatherRecommendation(weatherMain, temp) {
    let recommendation = "";
    
    switch(weatherMain) {
        case "Rain":
        case "Drizzle":
            recommendation = "It's rainy today. Don't forget your umbrella and wear waterproof shoes.";
            break;
        case "Snow":
            recommendation = "Snow expected today. Wear warm clothes and be careful on slippery roads.";
            break;
        case "Clear":
            if (temp > 30) {
                recommendation = "It's hot and sunny! Apply sunscreen, wear a hat, and stay hydrated.";
            } else if (temp > 20) {
                recommendation = "Beautiful clear day. Great for outdoor activities!";
            } else {
                recommendation = "Clear skies but cool temperatures. Consider wearing a light jacket.";
            }
            break;
        case "Clouds":
            recommendation = "Cloudy conditions today. A light jacket might be useful.";
            break;
        case "Thunderstorm":
            recommendation = "Thunderstorms expected. Stay indoors and avoid open areas.";
            break;
        case "Mist":
        case "Fog":
            recommendation = "Reduced visibility due to mist/fog. Drive carefully and use fog lights.";
            break;
        default:
            recommendation = "Check the forecast regularly for changes in weather conditions.";
    }
    
    document.querySelector(".recommendation-text").textContent = recommendation;
}

// Get air quality data
async function getAirQuality(lat, lon) {
    try {
        const response = await fetch(`${airQualityUrl}lat=${lat}&lon=${lon}&appid=${apikey}`);
        const data = await response.json();
        
        if (data && data.list && data.list.length > 0) {
            const aqi = data.list[0].main.aqi;
            const aqiElement = document.querySelector(".aqi-value span");
            const aqiIndicator = document.querySelector(".aqi-indicator");
            
            // AQI value 1-5 (1: Good, 2: Fair, 3: Moderate, 4: Poor, 5: Very Poor)
            aqiElement.textContent = aqi;
            
            // Position indicator and set text
            const aqiPercentage = (aqi - 1) * 25; // Convert 1-5 scale to 0-100%
            aqiIndicator.style.left = `${aqiPercentage}%`;
            
            let aqiText = "";
            switch(aqi) {
                case 1: aqiText = "Good"; break;
                case 2: aqiText = "Fair"; break;
                case 3: aqiText = "Moderate"; break;
                case 4: aqiText = "Poor"; break;
                case 5: aqiText = "Very Poor"; break;
            }
            
            document.querySelector(".aqi-value").innerHTML = `AQI: <span>${aqi}</span> - ${aqiText}`;
        }
    } catch (error) {
        console.error("Error fetching air quality data:", error);
    }
}

// Update weather map
function updateWeatherMap(lat, lon) {
    const mapUrl = `https://openweathermap.org/weathermap?basemap=map&cities=false&layer=temperature&lat=${lat}&lon=${lon}&zoom=10`;
    weatherMap.src = mapUrl;
}

// Show error function
function showError() {
    loaderElement.style.display = "none";
    document.querySelector(".error").style.display = "block";
    document.querySelector(".weather").style.display = "none";
    document.querySelector(".search-history").style.display = "block";
}

// Get forecast data
async function getForecast(city, lat, lon) {
    try {
        const response = await fetch(forecastUrl + city + `&appid=${apikey}`);
        const data = await response.json();
        
        // Get coordinates for more API calls if not provided
        if (!lat || !lon) {
            lat = data.city.coord.lat;
            lon = data.city.coord.lon;
            getAirQuality(lat, lon);
            updateWeatherMap(lat, lon);
        }
        
        // Clear previous forecast
        forecastContainer.innerHTML = "";
        hourlyContainer.innerHTML = "";
        
        // Process hourly forecast (next 24 hours)
        const hourlyForecasts = data.list.slice(0, 8); // 8 entries = 24 hours (3-hour intervals)
        
        hourlyForecasts.forEach((forecast, index) => {
            const time = new Date(forecast.dt * 1000).toLocaleTimeString('en-US', { 
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const hourlyItem = document.createElement('div');
            hourlyItem.className = 'hourly-item';
            
            // Temperature with correct unit
            const tempUnit = currentUnit === "metric" ? "°C" : "°F";
            
            hourlyItem.innerHTML = `
                <p class="hourly-time">${index === 0 ? 'Now' : time}</p>
                <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png" alt="${forecast.weather[0].description}">
                <p class="hourly-temp">${Math.round(forecast.main.temp)}${tempUnit}</p>
            `;
            hourlyContainer.appendChild(hourlyItem);
        });
        
        // Get one forecast per day (excluding today)
        const dailyForecasts = {};
        const today = new Date().getDate();
        
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const day = date.getDate();
            
            // Skip today's forecast
            if (day !== today && !dailyForecasts[day]) {
                dailyForecasts[day] = item;
            }
        });
        
        // Display up to 5 days of forecast
        Object.values(dailyForecasts).slice(0, 5).forEach(forecast => {
            const date = new Date(forecast.dt * 1000);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayMonth = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            
            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            
            // Temperature with correct unit
            const tempUnit = currentUnit === "metric" ? "°C" : "°F";
            
            forecastItem.innerHTML = `
                <p class="forecast-day">${dayName}</p>
                <p class="forecast-date">${dayMonth}</p>
                <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png" alt="${forecast.weather[0].description}">
                <p class="forecast-temp">${Math.round(forecast.main.temp)}${tempUnit}</p>
                <p class="forecast-desc">${forecast.weather[0].main}</p>
            `;
            forecastContainer.appendChild(forecastItem);
        });
        
        // Get extended weather data if coordinates are available
        if (lat && lon) {
            getExtendedWeatherData(lat, lon);
        } else if (data && data.city && data.city.coord) {
            getExtendedWeatherData(data.city.coord.lat, data.city.coord.lon);
        }
    } catch (error) {
        console.error("Error fetching forecast:", error);
    }
}

// Add to search history
function addToSearchHistory(city) {
    // Don't add duplicates
    if (!searchHistory.includes(city)) {
        searchHistory.unshift(city);
        // Keep only the last 5 searches
        searchHistory = searchHistory.slice(0, 5);
        localStorage.setItem("weatherSearchHistory", JSON.stringify(searchHistory));
        updateSearchHistory();
    }
}

// Update search history UI
function updateSearchHistory() {
    historyList.innerHTML = "";
    searchHistory.forEach(city => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.textContent = city;
        historyItem.addEventListener('click', () => {
            searchBox.value = city;
            checkWeather(city);
        });
        historyList.appendChild(historyItem);
    });
}

// Check weather function
async function checkWeather(city) {
    document.querySelector(".weather").style.display = "none";
    document.querySelector(".error").style.display = "none";
    document.querySelector(".search-history").style.display = "none";
    loaderElement.style.display = "flex";
    
    try {
        const response = await fetch(`${apiurl.replace('units=metric', 'units=' + currentUnit)}${city}&appid=${apikey}`);

        if (response.status == 404) {
            showError();
            return;
        } else {
            const data = await response.json();
            updateWeatherUI(data);
            getForecast(city);
            addToSearchHistory(city);
        }
    } catch (error) {
        showError();
    }
}

// Event listeners
searchBtn.addEventListener("click", () => {
    if (searchBox.value.trim() !== "") {
        checkWeather(searchBox.value);
    }
});

searchBox.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && searchBox.value.trim() !== "") {
        checkWeather(searchBox.value);
    }
});

// NEW: Get extended weather data including UV and moon phase
async function getExtendedWeatherData(lat, lon) {
    try {
        const response = await fetch(`${moonPhaseUrl}lat=${lat}&lon=${lon}&exclude=minutely&appid=${apikey}&units=${currentUnit}`);
        const data = await response.json();
        
        if (data) {
            // Update UV Index
            if (data.current && data.current.uvi !== undefined) {
                updateUVIndex(data.current.uvi);
            }
            
            // Update Moon Phase
            if (data.daily && data.daily.length > 0) {
                updateMoonPhase(data.daily[0].moon_phase);
            }
            
            // Update Precipitation Forecast
            if (data.hourly && data.hourly.length > 0) {
                updatePrecipitationForecast(data.hourly.slice(0, 12));
            }
        }
    } catch (error) {
        console.error("Error fetching extended weather data:", error);
    }
}

// NEW: Update UV Index display
function updateUVIndex(uvi) {
    uvValue.textContent = uvi;
    
    // Position indicator (0-12 scale)
    const percentage = (uvi / 12) * 100;
    uvIndicator.style.left = `${Math.min(percentage, 100)}%`;
    
    // Set advice and category based on UV value
    let category = "";
    let advice = "";
    
    if (uvi < 3) {
        category = "Low";
        advice = "No protection needed. You can safely stay outside.";
    } else if (uvi < 6) {
        category = "Moderate";
        advice = "Some protection required. Wear sunscreen and a hat.";
    } else if (uvi < 8) {
        category = "High";
        advice = "Protection essential. Seek shade during midday hours.";
    } else if (uvi < 11) {
        category = "Very High";
        advice = "Extra protection needed. Avoid being outside during midday hours.";
    } else {
        category = "Extreme";
        advice = "Maximum protection required. Avoid being outside.";
    }
    
    document.querySelector(".uv-value").innerHTML = `UV Index: <span>${uvi}</span> - ${category}`;
    uvAdvice.textContent = advice;
}

// NEW: Update Moon Phase display
function updateMoonPhase(moonPhase) {
    // Moon phase is a value between 0 and 1
    // 0 and 1 = New Moon, 0.25 = First Quarter, 0.5 = Full Moon, 0.75 = Last Quarter
    
    let phaseName = "";
    let illumination = 0;
    
    if (moonPhase === 0 || moonPhase === 1) {
        phaseName = "New Moon";
        illumination = 0;
        moonCircle.style.boxShadow = "inset -40px 0 0 0 #1a2530"; // Full shadow
    } else if (moonPhase < 0.25) {
        phaseName = "Waxing Crescent";
        illumination = moonPhase * 4 * 100;
        moonCircle.style.boxShadow = `inset -${40 - (moonPhase * 160)}px 0 0 0 #1a2530`;
    } else if (moonPhase === 0.25) {
        phaseName = "First Quarter";
        illumination = 50;
        moonCircle.style.boxShadow = "inset -20px 0 0 0 #1a2530"; // Half shadow
    } else if (moonPhase < 0.5) {
        phaseName = "Waxing Gibbous";
        illumination = 50 + ((moonPhase - 0.25) * 4 * 50);
        moonCircle.style.boxShadow = `inset -${20 - ((moonPhase - 0.25) * 80)}px 0 0 0 #1a2530`;
    } else if (moonPhase === 0.5) {
        phaseName = "Full Moon";
        illumination = 100;
        moonCircle.style.boxShadow = "none"; // No shadow (full illumination)
    } else if (moonPhase < 0.75) {
        phaseName = "Waning Gibbous";
        illumination = 100 - ((moonPhase - 0.5) * 4 * 50);
        moonCircle.style.boxShadow = `inset ${(moonPhase - 0.5) * 80}px 0 0 0 #1a2530`;
    } else if (moonPhase === 0.75) {
        phaseName = "Last Quarter";
        illumination = 50;
        moonCircle.style.boxShadow = "inset 20px 0 0 0 #1a2530"; // Half shadow from other side
    } else {
        phaseName = "Waning Crescent";
        illumination = (1 - moonPhase) * 4 * 50;
        moonCircle.style.boxShadow = `inset ${40 - ((1 - moonPhase) * 160)}px 0 0 0 #1a2530`;
    }
    
    // Calculate next phase date (approximate)
    const now = new Date();
    const nextPhaseDate = new Date();
    
    if (moonPhase < 0.25) {
        // Next phase is First Quarter
        const daysToFirstQuarter = (0.25 - moonPhase) * 29.5;
        nextPhaseDate.setDate(now.getDate() + Math.round(daysToFirstQuarter));
    } else if (moonPhase < 0.5) {
        // Next phase is Full Moon
        const daysToFullMoon = (0.5 - moonPhase) * 29.5;
        nextPhaseDate.setDate(now.getDate() + Math.round(daysToFullMoon));
    } else if (moonPhase < 0.75) {
        // Next phase is Last Quarter
        const daysToLastQuarter = (0.75 - moonPhase) * 29.5;
        nextPhaseDate.setDate(now.getDate() + Math.round(daysToLastQuarter));
    } else {
        // Next phase is New Moon
        const daysToNewMoon = (1 - moonPhase) * 29.5;
        nextPhaseDate.setDate(now.getDate() + Math.round(daysToNewMoon));
    }
    
    const nextPhaseFormatted = nextPhaseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    moonPhaseName.textContent = phaseName;
    moonPhaseDate.textContent = `Next phase: ${nextPhaseFormatted}`;
    moonIllumination.textContent = `Illumination: ${Math.round(illumination)}%`;
}

// NEW: Update Wind Direction Compass
function updateWindCompass(degrees, speed, gust) {
    // Rotate the compass arrow to match wind direction
    compassArrow.style.transform = `rotate(${degrees}deg)`;
    
    // Display wind direction as cardinal direction
    const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    const index = Math.round(degrees / 22.5) % 16;
    
    // Update the UI
    windDirection.textContent = `${directions[index]} (${degrees}°)`;
    
    // Display wind speed in appropriate units
    const windSpeedUnit = currentUnit === "metric" ? "km/h" : "mph";
    windSpeedCompass.textContent = `${speed} ${windSpeedUnit}`;
    
    // Display gust information if available
    if (gust) {
        windGust.textContent = `Gusts: ${gust} ${windSpeedUnit}`;
        windGust.style.display = "block";
    } else {
        windGust.style.display = "none";
    }
}

// NEW: Update Precipitation Forecast Chart
function updatePrecipitationForecast(hourlyData) {
    precipitationChart.innerHTML = "";
    precipitationLabels.innerHTML = "";
    
    let maxProbability = 0;
    let maxProbTime = "";
    
    hourlyData.forEach((hour, index) => {
        const time = new Date(hour.dt * 1000);
        const timeLabel = time.toLocaleTimeString('en-US', { hour: '2-digit' });
        const probability = Math.round(hour.pop * 100); // pop = probability of precipitation (0-1)
        
        // Track highest probability for summary
        if (probability > maxProbability) {
            maxProbability = probability;
            maxProbTime = timeLabel;
        }
        
        // Create bar for chart
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = `${probability}%`;
        
        // Color based on probability
        if (probability < 30) {
            bar.style.backgroundColor = "#3498db";
        } else if (probability < 60) {
            bar.style.backgroundColor = "#f39c12";
        } else {
            bar.style.backgroundColor = "#e74c3c";
        }
        
        // Add tooltip with exact percentage
        bar.setAttribute('title', `${probability}% at ${timeLabel}`);
        
        precipitationChart.appendChild(bar);
        
        // Add time label
        const label = document.createElement('div');
        label.className = 'chart-label';
        label.textContent = index === 0 ? 'Now' : timeLabel;
        precipitationLabels.appendChild(label);
    });
    
    // Update summary text
    if (maxProbability > 0) {
        precipitationSummary.textContent = `Chance of precipitation peaks at ${maxProbability}% around ${maxProbTime}`;
    } else {
        precipitationSummary.textContent = "No precipitation expected in the next 12 hours";
    }
}

// NEW: Compare weather with another city
compareBtn.addEventListener("click", async () => {
    const cityToCompare = compareCityInput.value.trim();
    
    if (cityToCompare && currentCity && cityToCompare !== currentCity) {
        try {
            comparisonResults.innerHTML = '<p class="loading-comparison">Loading comparison data...</p>';
            
            const response = await fetch(`${apiurl.replace('units=metric', 'units=' + currentUnit)}${cityToCompare}&appid=${apikey}`);
            
            if (response.status !== 200) {
                comparisonResults.innerHTML = '<p class="comparison-error">City not found. Please check the name and try again.</p>';
                return;
            }
            
            const compareData = await response.json();
            
            // Get current city data again to ensure we're comparing the latest
            const currentCityResponse = await fetch(`${apiurl.replace('units=metric', 'units=' + currentUnit)}${currentCity}&appid=${apikey}`);
            const currentCityData = await currentCityResponse.json();
            
            // Create comparison UI
            createComparisonUI(currentCityData, compareData);
            
        } catch (error) {
            console.error("Error in weather comparison:", error);
            comparisonResults.innerHTML = '<p class="comparison-error">An error occurred. Please try again.</p>';
        }
    } else if (cityToCompare === currentCity) {
        comparisonResults.innerHTML = '<p class="comparison-error">Please enter a different city to compare with.</p>';
    } else {
        comparisonResults.innerHTML = '<p class="comparison-placeholder">Enter a city above to compare weather conditions</p>';
    }
});

// NEW: Create comparison UI
function createComparisonUI(currentCityData, compareData) {
    const tempUnit = currentUnit === "metric" ? "°C" : "°F";
    const speedUnit = currentUnit === "metric" ? "km/h" : "mph";
    
    const comparisonHTML = `
        <div class="comparison-table">
            <div class="comparison-header">
                <div class="city-column">Conditions</div>
                <div class="city-column">${currentCityData.name}</div>
                <div class="city-column">${compareData.name}</div>
            </div>
            <div class="comparison-row">
                <div class="condition-name">Temperature</div>
                <div class="city-value">${Math.round(currentCityData.main.temp)}${tempUnit}</div>
                <div class="city-value ${compareData.main.temp > currentCityData.main.temp ? 'higher' : compareData.main.temp < currentCityData.main.temp ? 'lower' : ''}">
                    ${Math.round(compareData.main.temp)}${tempUnit}
                </div>
            </div>
            <div class="comparison-row">
                <div class="condition-name">Weather</div>
                <div class="city-value">${currentCityData.weather[0].main}</div>
                <div class="city-value">${compareData.weather[0].main}</div>
            </div>
            <div class="comparison-row">
                <div class="condition-name">Humidity</div>
                <div class="city-value">${currentCityData.main.humidity}%</div>
                <div class="city-value ${compareData.main.humidity > currentCityData.main.humidity ? 'higher' : compareData.main.humidity < currentCityData.main.humidity ? 'lower' : ''}">
                    ${compareData.main.humidity}%
                </div>
            </div>
            <div class="comparison-row">
                <div class="condition-name">Wind Speed</div>
                <div class="city-value">${currentCityData.wind.speed} ${speedUnit}</div>
                <div class="city-value ${compareData.wind.speed > currentCityData.wind.speed ? 'higher' : compareData.wind.speed < currentCityData.wind.speed ? 'lower' : ''}">
                    ${compareData.wind.speed} ${speedUnit}
                </div>
            </div>
            <div class="comparison-row">
                <div class="condition-name">Pressure</div>
                <div class="city-value">${currentCityData.main.pressure} hPa</div>
                <div class="city-value ${compareData.main.pressure > currentCityData.main.pressure ? 'higher' : compareData.main.pressure < currentCityData.main.pressure ? 'lower' : ''}">
                    ${compareData.main.pressure} hPa
                </div>
            </div>
        </div>
        <div class="distance-info">
            Distance between cities: ${calculateDistance(
                currentCityData.coord.lat,
                currentCityData.coord.lon,
                compareData.coord.lat,
                compareData.coord.lon
            )} km
        </div>
    `;
    
    comparisonResults.innerHTML = comparisonHTML;
}

// NEW: Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1); 
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return Math.round(distance);
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

// Initialize allergen data (mock data - would be replaced with actual API data)
function initializeAllergenData() {
    // This would normally come from an API, but we're using mock data for demonstration
    const allergens = [
        { name: "Tree Pollen", level: "Low", percentage: 30 },
        { name: "Grass Pollen", level: "Moderate", percentage: 65 },
        { name: "Ragweed", level: "High", percentage: 85 },
        { name: "Mold", level: "Low", percentage: 15 }
    ];
    
    const allergenItems = document.querySelectorAll(".allergen-item");
    
    allergenItems.forEach((item, index) => {
        if (index < allergens.length) {
            const allergen = allergens[index];
            item.querySelector(".allergen-name").textContent = allergen.name;
            item.querySelector(".allergen-level").style.width = `${allergen.percentage}%`;
            item.querySelector(".allergen-value").textContent = allergen.level;
            
            // Set color based on level
            const levelElement = item.querySelector(".allergen-level");
            if (allergen.level === "Low") {
                levelElement.style.backgroundColor = "#3498db";
            } else if (allergen.level === "Moderate") {
                levelElement.style.backgroundColor = "#f39c12";
            } else {
                levelElement.style.backgroundColor = "#e74c3c";
            }
        }
    });
    
    // Update time
    document.querySelector(".update-time").textContent = "2 hours ago";
}

// Initialize weather statistics (mock data - would be replaced with actual API data)
function initializeWeatherStats() {
    // This would normally come from a historical weather API
    const stats = {
        recordHigh: { value: "35°C", date: "Aug 2022" },
        recordLow: { value: "-5°C", date: "Jan 2021" },
        avgHigh: { value: "25°C", date: "This month" },
        avgLow: { value: "15°C", date: "This month" }
    };
    
    const statItems = document.querySelectorAll(".stat-item");
    const statTitles = ["Record High", "Record Low", "Avg High", "Avg Low"];
    const statValues = [stats.recordHigh.value, stats.recordLow.value, stats.avgHigh.value, stats.avgLow.value];
    const statDates = [stats.recordHigh.date, stats.recordLow.date, stats.avgHigh.date, stats.avgLow.date];
    
    statItems.forEach((item, index) => {
        item.querySelector(".stat-title").textContent = statTitles[index];
        item.querySelector(".stat-value").textContent = statValues[index];
        item.querySelector(".stat-date").textContent = statDates[index];
    });
}

// Call initialization functions
document.addEventListener("DOMContentLoaded", function() {
    // Initialize new components
    initializeAllergenData();
    initializeWeatherStats();
    
    // Initialize search history
    updateSearchHistory();
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        themeToggle.checked = true;
        document.documentElement.setAttribute("data-theme", "dark");
    }
});
