const SlackBot = require('slackbots');
const axios = require('axios');
const channel = 'community-chat';

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
    `
Pollutionbot is operational! 
Type @pollutionbot city
Find out more @pollutionbot help
`,
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

Pollution bot v0.2, uses public API services, so if a large
city is coming up as 4oo it could be due to ratelimit settings.`,
      params
    );
    return;
  }
  let city = '';

  for (let i = 1; i < initialData.length; i++) {
    if (initialData.length == 1) {
      city = initialData[1];
    } else {
      city += initialData[i] + ' ';
    }
  }
  checkCityValidity(city);
}

function checkCityValidity(city) {
  axios
    .get(
      `https://api.apixu.com/v1/current.json?key=${
        process.env.cityToken
      }&q=${city}`
    )
    .then(res => {
      console.log('got a response');
      getCoords(city);
    })
    .catch(err => {
      let error = { error: "Couldn't get coordinates for that location" };
      cityNotFound(error);
      console.log('there was an error');
    });
}

function getCoords(city) {
  axios
    .get(
      `https://api.opencagedata.com/geocode/v1/geojson?q=${city}&key=${
        process.env.geocodingToken
      }`
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
      `http://api.airvisual.com/v2/nearest_city?lat=${coordinates[1]}&lon=${
        coordinates[0]
      }&key=${process.env.betterApiToken}`
    )
    .then(res => {
      console.log(res.data.data.current.pollution.aqius);
      handleAqi(res.data.data.current.pollution.aqius);
    })
    .catch(err => {
      console.log('couldnt find city');
      let error = {
        error:
          "AQI couldn't be found by this location at this time. Possible ratelimit was exceeded."
      };
      cityNotFound(error);
    });
  // axios
  //   .get(
  //     `https://api.waqi.info/feed/geo:${coordinates[1]};${
  //       coordinates[0]
  //     }/?token=${process.env.apiToken}`
  //   )
  //   .then(res => {
  //     console.log(res.data.status);
  //     console.log('res.data.status is..', res.data.status);

  //     if (res.data.status == 'nug' || res.data.data == null) {
  //       console.log('res.status returned null or nug');
  //       cityNotFound();
  //       return;
  //     } else {
  //       console.log(res.data);
  //       handleAqi(res.data.data.aqi);
  //     }
  //   })
  //   .catch(err => {
  //     console.log(err);
  //     cityNotFound();
  //   });
}

function cityNotFound(err) {
  const params = {
    icon_emoji: ':question:'
  };
  bot.postMessageToChannel(
    channel,
    `City not found [4oo] ${err.error}`,
    params
  );
}
