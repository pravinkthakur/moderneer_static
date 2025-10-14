
module.exports = {
  default: {
    require: [
      "features/step_definitions/**/*.js",
      "features/support/**/*.js"
    ],
    publishQuiet: true,
    format: ["progress"],
    paths: ["features/**/*.feature"],
    worldParameters: {}
  }
};
