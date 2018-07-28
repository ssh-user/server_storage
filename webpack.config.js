const path = require('path');
const webpack = require("webpack");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');


const APP = {
    mode: "production",
    entry: {
        react: "./src/react/index.jsx"
    },
    output: {
        path: path.join(__dirname, "webpack_build/"),
        filename: "[name].bundle.js"
    },

    performance: {
        hints: false
    },

    module: {
        rules: [
            {
                test: /\.(css)$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.(html)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'html-loader'
                }
            },
            {
                test: /\.(jsx)?$/,
                exclude: /(node_modules)/,
                loader: "babel-loader",
                options: {
                    presets: ["env", "react"],
                    plugins: ['babel-plugin-transform-runtime']
                }
            }
        ]
    },

    plugins: [
        new CleanWebpackPlugin("webpack_build"),

        new CopyWebpackPlugin([
            {
                from: path.join(__dirname, "src/"),
                to: path.join(__dirname, "webpack_build/"),
                ignore: [
                    'react/**/*'
                ]
            }
        ])
    ]
};



module.exports = [APP];