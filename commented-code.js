// function getBetterData(city) {
//   axios
//     .get(
//       `https://api.opencagedata.com/geocode/v1/geojson?q=${city}&key=${
//         process.env.geocodingToken
//       }`
//     )
//     .then(geodata => {
//       console.log(geodata.data.features[0].geometry.coordinates);
//       let coordinates = geodata.data.features[0].geometry.coordinates;
//       return axios.get(
//         `http://api.airvisual.com/v2/nearest_station?lat=${
//           coordinates[1]
//         }&lon=${coordinates[0]}&key=${process.env.betterApiToken}'`
//       );
//     })
//     .then(results => {
//       console.log(results);
//     })
//     .catch(err => console.error(err));
// }

function getData(city) {
  axios
    .get(
      `https://api.waqi.info/search/?token=${
        process.env.apiToken
      }&keyword=${city}`
    )
    .then(res => {
      return res.data.data;
    })
    .then(data => {
      if (data.length == 0) {
        // console.log("City not found");
        const params = {
          icon_emoji: ':question:'
        };
        bot.postMessageToChannel(channel, 'City not found [4oo]', params);
        return null;
      } else if (data[0].aqi == '-' || data[0].aqi == '') {
        // console.log("Aqi data not found");
        const params = {
          icon_emoji: ':question:'
        };
        bot.postMessageToChannel(
          channel,
          "Couldn't find data on that city [4o4]",
          params
        );
        return null;
      } else if (data.length > 0) {
        handleAqi(data[0].aqi);
        // console.log("City found");
      }
    })
    .catch(err => console.log(err));
}
