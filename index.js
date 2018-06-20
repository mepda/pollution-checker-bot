const SlackBot = require('slackbots');
const axios = require('axios');
const channel = 'botplayground';

const bot = new SlackBot({
  token: process.env.botToken,
  name: 'pollutionbot'
});

//Handle AQI
function handleAqi(aqi) {
  if (aqi < 0 || aqi === '') {
    const params = {
      icon_emoji: ':question:'
    };
    bot.postMessageToChannel(
      channel,
      "I think there was a mistake. Couldn't find anything about " + city,
      params
    );
  } else if (aqi < 40) {
    const params = {
      icon_emoji: ':smile_cat:'
    };
    bot.postMessageToChannel(
      channel,
      'Easy breathing, the aqi is: ' + aqi,
      params
    );
  } else if (aqi < 80) {
    const params = {
      icon_emoji: ':smiley_cat:'
    };
    bot.postMessageToChannel(
      channel,
      'Light pollution detected. Aqi is: ' + aqi,
      params
    );
  } else if (aqi < 120) {
    const params = {
      icon_emoji: ':cat:'
    };
    bot.postMessageToChannel(
      channel,
      'Moderate pollution detected. Mask recommended. Aqi is: ' + aqi,
      params
    );
  } else if (aqi < 180) {
    const params = {
      icon_emoji: ':crying_cat_face:'
    };
    bot.postMessageToChannel(
      channel,
      'High levels of pollution detected. Mask or staying indoors recommeneded. Aqi is currently: ' +
        aqi,
      params
    );
  } else if (aqi < 250) {
    const params = {
      icon_emoji: ':pouting_cat:'
    };
    bot.postMessageToChannel(
      channel,
      'Dangerous levels of pollution detected. Staying indoors recommeneded. Aqi is currently: ' +
        aqi,
      params
    );
  }
}

//start handler
bot.on('start', () => {
  const params = {
    icon_emoji: ':earth_americas:'
  };

  bot.postMessageToChannel(
    channel,
    'Check the pollution level of a city with @pollutionbot city',
    params
  );
});

//close handler
bot.on('close', () => {
  const params = {
    icon_emoji: ':zzz:'
  };

  bot.postMessageToChannel(channel, 'Pollutionbot is going offline', params);
});

//error handler
bot.on('error', error => {
  console.log(error);
});

//message handler
//debugged, checked that the data.bot_id doesn't cause the bot to infinitely call itself
bot.on('message', data => {
  // console.log(data);
  if (data.bot_id == 'BB9VDK7B6' || data.username == 'pollutionbot') {
    // console.log('bots speaking');
    return;
  }
  if (data.text) {
    let botName;
    console.log(data.text.split(' '));
    if (data.text.split(' ')[0] != '<@UBAATMK4M>') {
      console.log("doesn't contain @pollutionbot");
      return;
    }
    bot.getUserId('pollutionbot').then(data => {
      botName = data.text;
      //have to check if the bot is mentioned, otherwise it responds to any message input
      //additionally must check the bots name (may vary on different channels)
      //if a message DOESNT include the @pollution bot, then return
      if (!data.text.split(' ').includes('@' + botName)) {
        return;
      }
      //ensure that the city is at least 3 characters long
      if (data.text.split(' ')[1].length <= 2) {
        return;
      }
    });
  }
  //make sure we're getting a message and it's not from our bot
  if (data.type !== 'message' || data.bot_id == 'BB9VDK7B6') {
    return;
  } else {
    handleMessage(data.text);
  }
});

function handleMessage(data) {
  let initialData = data.split(' ');
  if (data.includes(' help')) {
    const params = {
      icon_emoji: ':earth_asia:'
    };
    bot.postMessageToChannel(
      channel,
      `You can find pollution levels of various cities by typing @pollutionbot cityname (i.e. @pollutionbot worcester)
Note that I might take some time occasionally if there are many requests`,
      params
    );
    return;
  }
  let city = '';

  for (let i = 1; i < initialData.length; i++) {
    if (initialData.length == 1) {
      city = initialData[1];
    } else {
      city += initialData[i] + '+';
    }
  }
  checkCityValidity(city);
}

function checkCityValidity(city) {
  axios
    .get(
      `https://api.apixu.com/v1/current.json?key=6ba458338eb54203a9381751182006&q=${city}`
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

function getAqi(coordinates) {
  axios
    .get(
      `https://api.waqi.info/feed/geo:${coordinates[1]};${
        coordinates[0]
      }/?token=${process.env.apiToken}`
    )
    .then(res => {
      console.log(res.data);
      handleAqi(res.data.data.aqi);
    });
}

//first aqi api
///feed/geo::lat;:lng/?token=:token

//http://api.airvisual.com/v2/nearest_station?lat={{LATITUDE}}&lon={{LONGITUDE}}&key={{YOUR_API_KEY}}

//https://api.opencagedata.com/geocode/v1/geojson?q=venice%20italy&key=d0bff37a728b46939cf3b8c5e818955c

//ex https://api.opencagedata.com/geocode/v1/geojson?q=venice%20italy&key={geocodingToken}

function cityNotFound() {
  const params = {
    icon_emoji: ':question:'
  };
  bot.postMessageToChannel(channel, 'City not found [4oo]', params);
}

// function getBetterDataOne(city) {
//   axios
//     .get(
//       `https://api.opencagedata.com/geocode/v1/geojson?q=${city}&key=${
//         process.env.geocodingToken
//       }`
//     )
//     ///feed/geo::lat;:lng/?token=:token
//     .then(geodata => {
//       console.log(
//         'Is the geodata.features.length equal to 0? ' +
//           geodata.data.features.length ==
//           0
//       );
//       if (geodata.data.features.length == 0) {
//         cityNotFound();
//         return null;
//       } else {
//         console.log(geodata.data.features[0].geometry.coordinates);
//         return geodata.data.features[0].geometry.coordinates;
//       }
//     })
//     .then(coordinates => {
//       return axios.get(
//         `https://api.waqi.info/feed/geo:${coordinates[1]};${
//           coordinates[0]
//         }/?token=${process.env.apiToken}`
//       );
//     })
//     .then(results => {
//       console.log(results);
//       if (results.data) {
//         console.log(results.data.data);
//         if (results.data.data.aqi == 'null' || results.data.status == 'nug') {
//           console.log('null results!');
//           return;
//         } else if (results.data.length > 1) {
//           console.log('more than one option for AQI responses');
//           handleAqi(results.data[0].data.aqi);
//         }
//         handleAqi(results.data.data.aqi);
//       }
//     })
//     // .then(data => {
//     //   console.log(data);
//     // })
//     .catch(err => console.error(err));
// }
