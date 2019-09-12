const path = require("path"),
  fs = require("fs");

const entry = {};

fs.readdirSync("views")
  .filter(file => /\w+.view/.test(file))
  .filter(file => fs.lstatSync(path.join("views", file)).isDirectory())
  .forEach(file => {
    const name = file.split(".")[0];
    entry[name] = `./views/${ file }`;
  })

module.exports = {
	entry,

	output: {
		filename: '[name].bundle.js',
		path: path.resolve(__dirname, 'static', 'js')
	},

  	module: {
    	rules: [
      		{
        		loader: 'babel-loader',
		        test: /\.jsx?$/,
		        exclude: /node_modules/,
  				options: {
  					presets: [
              '@babel/preset-env',
              '@babel/preset-react'
            ],
            plugins: ['@babel/plugin-proposal-class-properties']
  				}
      		},
      		{
        		use: ['style-loader', 'css-loader'],
        		test: /\.css$/
      		}
    	]
  	}
}
