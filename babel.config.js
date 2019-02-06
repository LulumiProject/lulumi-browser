"use strict";

module.exports = function(api) {
  const env = api.env();

  let testEnv = false;

  const envOpts = {
    targets: {
      node: "10.13.0",
    }
  };

  switch (env) {
    // Configs used during bundling builds.
    case "test":
      testEnv = true;
      break;
    case "development":
    case "production":
      envOpts.modules = false;
      break;
  }

  const config = {
    comments: false,
    presets: [["@babel/preset-env", envOpts]],
    plugins: []
  };

  if (testEnv) {
    config.plugins.push("istanbul");
  }

  return config;
};
