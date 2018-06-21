const axios = require('axios');

let user_input = 'san francisco';
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
//http://api.airvisual.com/v2/nearest_city?lat=-33.928992&lon=18.417396&key=Rs67sGwyS8WXBM6px

function getAqi(coordinates) {
  axios
    .get(
      `http://api.airvisual.com/v2/nearest_city?lat=${coordinates[1]}&lon=${
        coordinates[0]
      }&key=${process.env.betterApiToken}`
    )
    .then(res => {
      console.log(res.data.status);
      if (res.data.status == 'fail') {
        console.log("couldn't find that city");
        return;
      }
      console.log(res.data.data.current.pollution.aqius);
    })
    .catch(err => console.log('couldnt find city'));
}
