const config = {
  bull: {
    redis: {
      url: "127.0.0.1",
      db: 3,
    },
  },
};

exports.bull = config.bull;
