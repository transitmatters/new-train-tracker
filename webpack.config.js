const HtmlWebpackPlugin = require('html-webpack-plugin');
const PwaManifestPlugin = require('webpack-pwa-manifest');
const CopyPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const autoprefixer = require('autoprefixer');

// eslint-disable-next-line no-undef
module.exports = {
    output: {
        filename: '[name].[contenthash].bundle.js',
        chunkFilename: '[name].[contenthash].bundle.js',
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
            {
                test: /\.css$/i,
                use: [
                    'style-loader',
                    'css-loader',
                    { loader: 'postcss-loader', options: { plugins: () => [autoprefixer()] } },
                ],
            },
            {
                test: /\.(png|svg)$/,
                loader: 'file-loader',
            },
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: 'static/template.html',
        }),
        new CopyPlugin({
            patterns: [{ from: 'static/images/apple-touch-icon.png', to: 'apple-touch-icon.png' }],
        }),
        new PwaManifestPlugin({
            name: 'TransitMatters New Train Tracker',
            short_name: 'New Train Tracker',
            display: 'fullscreen',
        }),
    ],
};
