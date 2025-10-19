const axios = require('axios');

async function getWeather(city) {
  try {
    // Using wttr.in API (Free, no API key needed)
    const response = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
    
    const data = response.data;
    const current = data.current_condition[0];
    const location = data.nearest_area[0];

    return {
      success: true,
      data: {
        location: {
          city: city,
          country: location.country[0].value,
          region: location.region[0].value,
          latitude: location.latitude,
          longitude: location.longitude
        },
        current: {
          temperature: `${current.temp_C}°C / ${current.temp_F}°F`,
          feelsLike: `${current.FeelsLikeC}°C / ${current.FeelsLikeF}°F`,
          condition: current.weatherDesc[0].value,
          humidity: `${current.humidity}%`,
          windSpeed: `${current.windspeedKmph} km/h`,
          windDirection: current.winddir16Point,
          pressure: `${current.pressure} mb`,
          visibility: `${current.visibility} km`,
          uvIndex: current.uvIndex,
          cloudCover: `${current.cloudcover}%`
        },
        forecast: data.weather.slice(0, 3).map(day => ({
          date: day.date,
          maxTemp: `${day.maxtempC}°C / ${day.maxtempF}°F`,
          minTemp: `${day.mintempC}°C / ${day.mintempF}°F`,
          condition: day.hourly[0].weatherDesc[0].value,
          chanceOfRain: `${day.hourly[0].chanceofrain}%`,
          sunrise: day.astronomy[0].sunrise,
          sunset: day.astronomy[0].sunset
        }))
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = async (req, res) => {
  const { city } = req.query;

  if (!city) {
    return res.status(400).json({
      success: false,
      message: 'City parameter is required',
      example: '/tools/weather?city=London'
    });
  }

  const result = await getWeather(city);
  res.json(result);
};
