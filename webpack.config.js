'use strict';

const path = require("path");

const config = {
    target: "web",
    mode: "production",
    entry: {
        index: path.join(__dirname, "src", "index.ts"),
    },
    resolve: {
        extensions: [".ts"]
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [{
                    loader: 'ts-loader'
                }]
            }
        ]
    },
    output: {
        path: path.join(__dirname, "dist/build"),
        filename: "index.js",
        library: '@papirfly/papirfly-authenticator',
        libraryTarget: 'umd',
    }
};

module.exports = config;