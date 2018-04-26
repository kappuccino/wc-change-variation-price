const path = require('path')
const webpack = require('webpack')
//const vueLoaderConfig = require('./build/vue-loader.conf')

function resolve (dir) {
	return path.join(__dirname, '..', dir)
}

module.exports = env => ({

	entry: {
		'price': './src/price.js'
	},
	output: {
		path: process.cwd()+'/dist/',
		filename: (env.prod ? 'bundle-prod' : 'bundle-dev') + '-[name].js'
	},

	resolve: {
		extensions: ['.js', '.vue', '.json'],
		alias: {
			'vue$': 'vue/dist/vue.esm.js',
			'@': resolve('src'),
		}
	},

	module: {
		rules: [
			{
				test: /\.vue$/,
				loader: 'vue-loader',
				//options: vueLoaderConfig
			},
			{
				test: /\.js$/,
				loader: 'babel-loader',
				//include: [resolve('src'), resolve('test')]
			}
		]
	}

})