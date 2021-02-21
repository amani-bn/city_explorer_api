"use strict";
const express = require("express");
require("dotenv").config();
const cors = require("cors");
const server = express();
server.use(cors());
const PORT = process.env.PORT || 3000;
// location route localhost:3000/location
server.get("/location", (req, res) => {
  const locData = require("./data/location.json");
  // console.log(locData);
  // console.log(locData[0]);
  const locObj = new Location(locData);
  // console.log(locData[0]);

  res.send(locObj);
});

function Location(locJson) {
  this.search_query = "Lynnwood";
  this.formatted_query = locJson[0].display_name;
  this.latitude = locJson[0].lat;
  this.longitude = locJson[0].lon;
}
// another route for weather localhost:3000/weather
const weathArr = [];

server.get("/weather", (req, res) => {
  const wethData = require("./data/weather.json");
  // console.log (wethData);
  wethData.data.forEach((element) => {
    
    const wethObj = new Weather(element);
    console.log(wethObj);
  });
  res.send(weathArr);
});

function Weather(wethJson) {
  // wether constructor

  this.forecast = wethJson.weather.description;
  this.time = new Date(wethJson.valid_date).toDateString();

  weathArr.push(this);

  // [
  //     {
  //       "forecast": "Partly cloudy until afternoon.",
  //       "time": "Mon Jan 01 2001"
  //     },
  //     {
  //       "forecast": "Mostly cloudy in the morning.",
  //       "time": "Tue Jan 02 2001"
  //     },
  //     ...
  //   ]
}
// function to handle error
server.use('*',(req,res)=>{
    res.status(500).send('Sorry, something went wrong')
})

server.listen(PORT, () => {
  console.log(`Listening on PORT ${PORT}`);
});
