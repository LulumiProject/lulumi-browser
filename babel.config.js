"use strict";

module.exports = function(api) {
  const env = api.env();

  let testEnv = false;

  const envOpts = {
    targets: {
      node: "10.18.0",
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
    plugins: [["@babel/plugin-proposal-decorators", { "legacy": true }], ["@babel/plugin-proposal-class-properties", { "loose" : true }]],
    presets: [["@babel/preset-env", envOpts], ["@babel/preset-typescript", envOpts]]
  };

  return config;
};
