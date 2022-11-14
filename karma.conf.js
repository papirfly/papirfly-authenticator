// Karma configuration
// Generated on Fri Nov 11 2022 13:36:15 GMT+0100 (Central European Standard Time)

module.exports = function(config) {
  config.set({
    frameworks: ["jasmine", "karma-typescript"],
    files: [
        "src/**/*.ts",
        "__tests__/**/*.ts",
    ],
    preprocessors: {
        "**/*.ts": "karma-typescript"
    },
    reporters: ["progress", "karma-typescript"],
    browsers: ["ChromeHeadless"],
    karmaTypescriptConfig: {
      reports: {}, // Disables the code coverage report
    },
  })
}
