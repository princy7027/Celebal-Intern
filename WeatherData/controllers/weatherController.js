const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const axios = require('axios');
const Weather = require('../models/Weather');

exports.getWeatherFromCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error('No file uploaded');
      err.status = 400;
      throw err;
    }

    const filePath = path.join(__dirname, '..', req.file.path);
    const cities = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        if (row.city) cities.push(row.city.trim());
      })
      .on('end', async () => {
        try {
          const weatherResults = [];

          for (const city of cities) {
            try {
              const response = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
              );

              const entry = {
                city,
                temperature: response.data.main.temp,
                weather: response.data.weather[0].description
              };

              await Weather.create(entry);
              weatherResults.push(entry);
            } catch (apiErr) {
              const errorEntry = {
                city,
                error: `Could not fetch weather: ${apiErr.response?.data?.message || apiErr.message}`
              };
              await Weather.create(errorEntry);
              weatherResults.push(errorEntry);
            }
          }

          res.status(200).json({
            success: true,
            count: weatherResults.length,
            data: weatherResults
          });

        } catch (innerErr) {
          next(innerErr);
        }
      });

  } catch (err) {
    next(err);
  }
};

exports.getWeatherHistory = async (req, res, next) => {
  try {
    const history = await Weather.find().sort({ createdAt: -1 }).limit(50);
    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (err) {
    next(err);
  }
};
