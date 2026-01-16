const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
	const isDevelopment = argv.mode === 'development';

	return {
		entry: {
			background: './src/background.ts',
			content: './src/content.ts',
			'chat-content': './src/chat-services/entry.ts',
			popup: './src/popup/index.tsx',
		},
		output: {
			path: path.resolve(__dirname, 'dist'),
			filename: '[name].js',
			clean: true,
		},
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					use: 'ts-loader',
					exclude: /node_modules/,
				},
				{
					test: /\.css$/,
					use: ['style-loader', 'css-loader'],
				},
				{
					test: /\.svg$/,
					type: 'asset/resource',
				},
			],
		},
		resolve: {
			extensions: ['.tsx', '.ts', '.js', '.jsx'],
		},
		plugins: [
			new CopyWebpackPlugin({
				patterns: [
					{ from: 'public/manifest.json', to: 'manifest.json' },
					{ from: 'public/icons', to: 'icons', noErrorOnMissing: true },
					{ from: 'src/popup/popup.html', to: 'popup.html' },
				],
			}),
		],
		devtool: isDevelopment ? 'inline-source-map' : false,
		optimization: {
			minimize: !isDevelopment,
		},
		// Chrome extensions need complete bundles per entry point
		optimization: {
			splitChunks: false,
			runtimeChunk: false,
		},
	};
};
