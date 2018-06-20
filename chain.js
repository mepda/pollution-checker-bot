const axios = require('axios');

let user_input = 'seoul';
checkCityValidity(user_input);
function checkCityValidity(city) {
  axios
    .get(
      `https://api.apixu.com/v1/current.json?key=6ba458338eb54203a9381751182006&q=${user_input}`
    )
    .then(res => {
      console.log('got a response');
      getCoords(city);
    })
    .catch(err => {
      console.log('there was an error');
    });
}

function getCoords(city) {
  axios
    .get(
      `https://api.opencagedata.com/geocode/v1/geojson?q=${city}&key=d0bff37a728b46939cf3b8c5e818955c`
    )
    .then(geodata => {
      console.log(
        `Coordinates are ${geodata.data.features[0].geometry.coordinates}`
      );
      getAqi(geodata.data.features[0].geometry.coordinates);
    })
    .catch(err => console.log(err));
}

//Rs67sGwyS8WXBM6px
//http://api.airvisual.com/v2/nearest_city?lat={{LATITUDE}}&lon={{LONGITUDE}}&key={{YOUR_API_KEY}}

function getAqi(coordinates) {
  axios
    .get(
      `http://api.airvisual.com/v2/nearest_city?lat=${coordinates[1]}&lon=${
        coordinates[0]
      }&key=${process.env.betterApiToken}`
    )
    .then(res => {
      // if (res.status == 'nug' || res.data == null) {
      //   return;
      // }
      console.log(res.data.data.current.pollution.aqius);
    });
}
