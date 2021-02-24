"use strict";
// Application Dependencies
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const superagent = require("superagent");
const pg = require("pg");

// Application Setup
const PORT = process.env.PORT || 3000;
const client = new pg.Client({connectionString: process.env.DATABASE_URL });
const server = express();
server.use(cors());

// Route Definitions
server.get('/', homeRoute);
server.get("/location", locationHandler);
server.get("/weather", weatherHandler);
server.get("/parks", parkHandler);
server.get("/movies", movieHandler);
server.get("/yelp", yelpHandler);

// server.use(handleError);

function homeRoute(req, res) {
  res.send('You Are In Home Route Now');
}


function locationHandler(req, res) {
  let city = [req.query.city];
  let SQL = `SELECT * FROM locations WHERE search_query=$1;`;
  client.query(SQL, city).then((result) => {
      if (result.rows.length > 0) {
        res.json(result.rows[0]);
      }

      else {
          getlocation(city,req,res);
      
      }

   })
  // .catch (()=>{
  //     // res.send('pppppppppppp',error.message)
  //     handleError(`Error`, req, res);
  // })
      
      
}   

function getlocation(city,req,res){
  let key = process.env.LOCATION_KEY;
    let url = `http://eu1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json
    `;
  return  superagent
  .get(url)
  .then((locData) => {
    const locObj = new Location(city, locData.body[0]);
    // res.send(locObj);
    let SQL = `INSERT INTO locations VALUES($1, $2, $3, $4)  RETURNING *;`;
    let saveValues = [locObj.search_query,locObj.formatted_query,locObj.latitude,locObj.longitude];
    client.query(SQL, saveValues)
    .then((result) => {
      res.json(result.rows[0]);
      })
  // .catch (()=>{
  //   // res.send('pppppppppppp',error.message)
  //   handleError(`Error from database`, req, res);
  // })
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
    // .catch(() => {
    //   handleError(`Error`, req, res);
    // });
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
    // .catch(() => {
    //   handleError('Error', req, res) 
    //    });
}
// movie route
function movieHandler(req, res) {
  // https://api.themoviedb.org/3/search/movie?api_key={api_key}&query=Jack+Reacher
  
  const city = req.query.search_query;
  let key = process.env.MOVIE_API_KEY;
  const url=`https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${city}`;
  superagent
    .get(url)
    .then((movData) => {
      let movie = movData.body.results.map((value) => {
        return new Movie(value);
      });
      res.send(movie);

      // console.log(movieArr);
    })
}
// yelp route
function yelpHandler (req,res){
  let city = req.query.search_query;
  let key =process.env.YELP_API_KEY;
  let limit=5;
  let page=req.query.page;
  let start = ((page - 1) * limit + 1);
  const url =`https://api.yelp.com/v3/businesses/search?location=${city}&limit=${limit}&offset=${start}`;
 
  superagent.get(url)
  .set (`Authorization`, `Bearer ${key}`)
  .then ((yelpInfo) =>{
  let yelp = yelpInfo.body.businesses.map((value) =>{
    return new Yelp (value);
  });
  res.send(yelp);

  })

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
  function Movie(movieData){
    this.title=movieData.title;
    this.overview=movieData.overview;
    this.average_votes=movieData.average_votes;
    this.total_votes=movieData.total_votes;
    this.image_url=`https://image.tmdb.org/t/p/w500/${movieData.poster_path}`;
    this.popularity=movieData.popularity;
    this.released_on=movieData.released_on;

// [
//   {
//     "title": "Sleepless in Seattle",
//     "overview": "A young boy who tries to set his dad up on a date after the death of his mother. He calls into a radio station to talk about his dad’s loneliness which soon leads the dad into meeting a Journalist Annie who flies to Seattle to write a story about the boy and his dad. Yet Annie ends up with more than just a story in this popular romantic comedy.",
//     "average_votes": "6.60",
//     "total_votes": "881",
//     "image_url": "https://image.tmdb.org/t/p/w500/afkYP15OeUOD0tFEmj6VvejuOcz.jpg",
//     "popularity": "8.2340",
//     "released_on": "1993-06-24"
//   },


  }

function Yelp(yelpData){
  this.name=yelpData.name;
  this.image_url=yelpData.image_url;
  this.price=yelpData.price;
  this.rating=yelpData.rating;
  this.url=yelpData.url;
// [
//   {
//     "name": "Pike Place Chowder",
//     "image_url": "https://s3-media3.fl.yelpcdn.com/bphoto/ijju-wYoRAxWjHPTCxyQGQ/o.jpg",
//     "price": "$$   ",
//     "rating": "4.5",
//     "url": "https://www.yelp.com/biz/pike-place-chowder-seattle?adjust_creative=uK0rfzqjBmWNj6-d3ujNVA&utm_campaign=yelp_api_v3&utm_medium=api_v3_business_search&utm_source=uK0rfzqjBmWNj6-d3ujNVA"
//   },
}
// function handleError(error, req, res) {
//   // res.status(500).send('error',error);
//   res.status(500).send(body)
// }



client
  .connect()
  .then(() => {
    server.listen(PORT, () => {
    console.log(`listening on ${PORT}`);
  })
  })


  

