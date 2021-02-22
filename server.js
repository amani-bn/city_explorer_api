"use strict";
// Application Dependencies
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const superagent = require("superagent");

// Application Setyp
const PORT = process.env.PORT || 3000;
const server = express();
server.use(cors());

// Route Definitions
server.get("/location", locationHandler);
// server.get("/weather",weatherHandler);
// server.get("/park",parkHandler);
// server.get("*",notFoundHandler);
// server.use(errorHandler);

function locationHandler(req, res) {
  const cityName = req.query.city;
  // url : https://eu1.locationiq.com/v1/search.php?key=YOUR_ACCESS_TOKEN&q=SEARCH_STRING&format=json

  let key = process.env.LOCATION_KEY;
  let url = `http://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json
  `;
  superagent
    .get(url)
    .then((locData) => {
      const locObj = new Location(cityName, locData.body[0]);
      res.send(locObj);
    })
    .catch(() => {
      errorHandler(`Error`, req, res);
    });
}

// location route localhost:3000/location
// server.get("/location", (req, res) => {
// const locData = require("./data/location.json");
// console.log(locData);
//   // console.log(locData[0]);
//   const cityName=
//   const locObj = new Location(locData);
//   // console.log(locData[0]);

//   res.send(locObj);
// });

// constructors
function Location(city, locJson) {
  this.search_query = city;
  this.formatted_query = locJson.display_name;
  this.latitude = locJson.lat;
  this.longitude = locJson.lon;
}
// another route for weather localhost:3000/weather
// const weathArr = [];

server.get("/weather", (req, res) => {
  const wethData = require("./data/weather.json");
  // console.log (wethData);

  let weathArr = wethData.data.map((value) => {
    const wethObj = new Weather(value);
    // console.log(weathArr);
    return wethObj;
  });
  // wethData.data.forEach((element) => {
  // console.log(wethObj);
  res.send(weathArr);
});

function Weather(wethJson) {
  // wether constructor

  this.forecast = wethJson.weather.description;
  this.time = new Date(wethJson.valid_date).toDateString();
  // weathArr.push(this);
}
// function to handle error
server.use("*", (req, res) => {
  let errorObj = {
    status: 500,
    responsetext: "Sorry, something went wrong",
  };
  res.send(errorObj);
});

server.listen(PORT, () => {
  console.log(`Listening on PORT ${PORT}`);
});
