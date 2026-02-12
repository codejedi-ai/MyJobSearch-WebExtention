const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
	entry: {
		content: './src/content.ts',
		background: './src/background.ts',
		popup: './src/popup/popup.ts'  // Added popup entry
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
	},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'dist'),
		clean: true,
	},
	plugins: [
		new CopyWebpackPlugin({
			patterns: [
				{ from: 'public/manifest.json', to: 'manifest.json' },
				{ from: 'public/icons', to: 'icons', noErrorOnMissing: true },
				{ from: 'public/logo.png', to: 'logo.png', noErrorOnMissing: true },
				{ from: 'public/logo-nobg.png', to: 'logo-nobg.png', noErrorOnMissing: true },
				{ from: 'src/popup/popup.html', to: 'popup.html' },
				// { from: 'src/popup/popup.js', to: 'popup.js' }, // Removed as it's now an entry point
			],
		}),
	],
};
