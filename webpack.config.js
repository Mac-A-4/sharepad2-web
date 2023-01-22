const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: {
    index:    './build/index/IndexPage.js',
    username: './build/username/UsernamePage.js',
    connect:  './build/connect/ConnectPage.js',
    session:  './build/session/SessionPage.js',
  },
  mode: 'development',
  output: {
    path: `${__dirname}/dist/js`,
    filename: '[name].js',
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
          {
            from: './public',
            to: `${__dirname}/dist`
          },
      ],
    }),
  ],
};
