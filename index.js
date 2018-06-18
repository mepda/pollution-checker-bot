const SlackBot = require("slackbots");
const axios = require("axios");

const bot = new SlackBot({
  token: process.env.botToken,
  name: "pollutionbot"
});

//start handler
bot.on("start", () => {
  const params = {
    icon_emoji: ":earth_americas:"
  };

  bot.postMessageToChannel(
    "general",
    "Check the pollution level of a city with @pollutionbot city",
    params
  );
});

//error handler
bot.on("error", error => {
  console.log(error);
});

//message handler
//debugged, checked that the data.bot_id doesn't cause the bot to infinitely call itself
bot.on("message", data => {
  if (data.text) {
    let botName;
    bot.getUserId("pollutionbot").then(data => {
      botName = data;
      //have to check if the bot is mentioned, otherwise it responds to any message input
      //additionally must check the bots name (may vary on different channels)
      if (!data.text.split(" ").includes("@" + botName)) {
        return;
      }
    });

    //ensure that the city is at least 3 characters long
    if (data.text.split(" ")[1].length <= 2) {
      return;
    }
  }
  //make sure we're getting a message and it's not from our bot
  if (data.type !== "message" || data.bot_id == "BB97K7P3R") {
    return;
  } else {
    handleMessage(data.text);
  }
});

function handleMessage(data) {
  let initialData = data.split(" ");
  if (data.includes(" help")) {
    const params = {
      icon_emoji: ":earth_asia:"
    };
    bot.postMessageToChannel(
      "general",
      `You can find pollution levels of various cities by typing @pollutionbot cityname (i.e. @pollutionbot worcester)
Note that I might take some time occasionally if there are many requests`,
      params
    );
    return;
  }
  let city = "";

  for (let i = 1; i < initialData.length; i++) {
    if (initialData.length == 1) {
      city = initialData[1];
    } else {
      city += initialData[i] + "+";
    }
  }
  getData(city);
}

function handleAqi(aqi) {
  if (aqi < 0 || aqi === "") {
    const params = {
      icon_emoji: ":question:"
    };
    bot.postMessageToChannel(
      "general",
      "I think there was a mistake. Couldn't find anything about " + city,
      params
    );
  } else if (aqi < 40) {
    const params = {
      icon_emoji: ":smile_cat:"
    };
    bot.postMessageToChannel(
      "general",
      "Easy breathing, the aqi is: " + aqi,
      params
    );
  } else if (aqi < 80) {
    const params = {
      icon_emoji: ":smiley_cat:"
    };
    bot.postMessageToChannel(
      "general",
      "Light pollution detected. Aqi is: " + aqi,
      params
    );
  } else if (aqi < 120) {
    const params = {
      icon_emoji: ":cat:"
    };
    bot.postMessageToChannel(
      "general",
      "Moderate pollution detected. Mask recommended. Aqi is: " + aqi,
      params
    );
  } else if (aqi < 180) {
    const params = {
      icon_emoji: ":crying_cat_face:"
    };
    bot.postMessageToChannel(
      "general",
      "High levels of pollution detected. Mask or staying indoors recommeneded. Aqi is currently: " +
        aqi,
      params
    );
  } else if (aqi < 250) {
    const params = {
      icon_emoji: ":pouting_cat:"
    };
    bot.postMessageToChannel(
      "general",
      "Dangerous levels of pollution detected. Staying indoors recommeneded. Aqi is currently: " +
        aqi,
      params
    );
  }
}

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
          icon_emoji: ":question:"
        };
        bot.postMessageToChannel("general", "City not found [4oo]", params);
        return null;
      } else if (data[0].aqi == "-" || data[0].aqi == "") {
        // console.log("Aqi data not found");
        const params = {
          icon_emoji: ":question:"
        };
        bot.postMessageToChannel(
          "general",
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
