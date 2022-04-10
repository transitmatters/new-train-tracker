const HtmlWebpackPlugin = require('html-webpack-plugin');
const PwaManifestPlugin = require('webpack-pwa-manifest');
const CopyPlugin = require('copy-webpack-plugin');
const autoprefixer = require('autoprefixer');

// eslint-disable-next-line no-undef
module.exports = {
    output: {
        filename: '[name].[contenthash].bundle.js',
        chunkFilename: '[name].[contenthash].bundle.js',
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    module: {
        rules: [
            {
                test: /\.(t|j)sx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true,
                    },
                },
            },
            {
                enforce: 'pre',
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'source-map-loader',
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
    devtool: 'source-map',
    plugins: [
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
