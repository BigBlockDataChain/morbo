const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const {spawn} = require('child_process')

// Config directories
const SRC_DIR = path.resolve(__dirname, 'src')
const OUTPUT_DIR = path.resolve(__dirname, 'dist')

module.exports = {
  entry: SRC_DIR + '/app.ts',
  mode: 'production',
  output: {
    path: OUTPUT_DIR,
    publicPath: '/',
    filename: 'bundle.js'
  },
  target: 'electron-renderer',
  optimization: {
    minimize: false,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [{loader: 'style-loader'}, {loader: 'css-loader'}],
      },
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules|\.test.ts$/,
      },
      {
        test: /\.svg$/,
        use: [{loader: 'file-loader?name=img/[name]__[hash:base64:5].[ext]'}],
      },
    ]
  },
  resolve: {
    extensions: ['.js', '.ts'],
  },
  plugins: [
    new HtmlWebpackPlugin({template: 'index.html'}),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
      'process.env.MORBO_HOME': JSON.stringify('./data'),
    })
  ],
  devtool: 'inline-source-map',
  devServer: {
    contentBase: OUTPUT_DIR,
    stats: {
      colors: true,
      chunks: false,
      children: false,
    },
    before() {
      spawn(
        'electron',
        ['.'],
        {shell: true, env: process.env, stdio: 'inherit'},
      )
      .on('close', code => process.exit(0))
      .on('error', spawnError => console.error(spawnError))
    }
  }
}
