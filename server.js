"use strict";
// Application Dependencies
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const superagent = require("superagent");
const pg = require("pg");

// Application Setup
const PORT = process.env.PORT || 3000;
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
// const client = new pg.Client({connectionString: process.env.DATABASE_URL});
const server = express();
server.use(cors());

// Route Definitions
server.get('/', homeRoute);
server.get("/location", locationHandler);
server.get("/weather", weatherHandler);
server.get("/parks", parkHandler);
server.use(errorHandler);
// server.get("/*", errorHandler);
// server.use(handleError);

function homeRoute(req, res) {
  res.send('home route');
}


function locationHandler(req, res) {
  let city = req.query.city;
  let SQL = `SELECT * FROM locations WHERE search_query=$1;`;
  client.query(SQL, city).then((result) => {
      if (result.rows.length > 0) {
        res.status(200).json(result.rows[0]);
      }

      else {
          getlocation(req,res);
      
      }

  })
  .catch (()=>{
      // res.send('pppppppppppp',error.message)
      handleErrors(`Error`, req, res);
  })
      
      
}   

function getlocation(){
  let key = process.env.LOCATION_KEY;
    let url = `http://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json
    `;
  superagent
  .get(url)
  .then((locData) => {

    const locObj = new Location(city, locData.body[0]);
    // res.send(locObj);
    

    let SQL = `INSERT INTO locations VALUES($1, $2, $3, $4)  RETURNING *;`;
    let saveValues = [
      locObj.search_query,
      locObj.formatted_query,
      locObj.latitude,
      locObj.longitude,
    ];
    client.query(SQL, saveValues)
    .then((result) => {
      res.status(200).json(result.rows[0]);
      })
  .catch (()=>{
    // res.send('pppppppppppp',error.message)
    errorHandler(`Error from database`, req, res);
})
  .catch(() => {
      // res.send('pppppppppppp',error.message)
      // res.status(500).send(errors);
      errorHandler(`Error `, req, res);


      });
});
  
}
function weatherHandler(req, res) {
  // https://api.weatherbit.io/v2.0/forecast/daily?city=Raleigh,NC&key=API_KEY
  const cityName = req.query.search_query;

  let key = process.env.WEATHER_API_KEY;
  const url = `http://api.weatherbit.io/v2.0/forecast/daily?city=${cityName}&key=${key}`;
  superagent
    .get(url)
    .then((weatData) => {
      let weathArr = weatData.body.data.map((value) => {
        return new Weather(value);
      });
      res.send(weathArr);

      console.log(weathArr);
    })
    .catch(() => {
      errorHandler(`Error`, req, res);
    });
}

function parkHandler(req, res) {
  // https://developer.nps.gov/api/v1/parks?parkCode=acad&api_key=wNBehwNfBlbKWvhCgiCjwV5ZFDSTLmCwwbxfVgqd

  let key = process.env.PARKS_API_KEY;
  let ParkString = req.query.latitude + ',' + req.query.longitude;
  let url = `https://developer.nps.gov/api/v1/parks?parkCode=${ParkString}&limit=3&api_key=${key}`;
  superagent
    .get(url)
    .then((parkData) => {
      const parkArr = parkData.body.data.map((value) => {
        const parkObj = new Park(value);
        return parkObj;
      });
      res.send(parkArr);
    })
    .catch(() => {
      errorHandler('Error', req, res) 
       });
}
// constructors
function Location(city, locJson) {
  this.search_query = city;
  this.formatted_query = locJson.display_name;
  this.latitude = locJson.lat;
  this.longitude = locJson.lon;
}

function Weather(wethJson) {
  this.forecast = wethJson.weather.description;
  this.time = new Date(wethJson.valid_date).toDateString();
}

function Park(geoData) {
  this.name = geoData.fullName;
  this.address = `${geoData.addresses[0].line1}${geoData.addresses[0].city}${geoData.addresses[0].stateCode}${geoData.addresses[0].postalCode}`;
  this.fee = geoData.entranceFees[0].cost || "0.00";
  this.description = geoData.description;
  this.url = geoData.url;
}
function errorHandler(error, req, res) {
  res.status(500).send(errObj);
}
client
  .connect()
  .then(() => {
    server.listen(PORT, () => {
    console.log(`listening on ${PORT}`);
  })
  })


  

