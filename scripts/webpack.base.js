var package = require('./../package.json');

const base = {
    entry: './src/index.js',
    output: {
        path: __dirname + './../dist',
        filename: 'index.bundle.js',
        library: 'silhouette',
        libraryTarget: 'umd',
    },
    module: { 
        rules: [{
            test: /\.js$/,
            exclude: /node_modules\//,
            use: [{
                loader: 'babel-loader',
                options: {
                    presets: [['env', {
                        targets: {
                            browsers: [
                                '> 5%',
                            ],
                            node: 'current',
                        }
                        
                    }]],
                    cacheDirectory: true,
                }
            }],
        }],
    },
    resolve:{
        alias: {
            '~': __dirname + './../',
        },
    },
    externals: Object.keys(package.dependencies).reduce((a, d) => {
        // adds all runtime dependencies to the exclude list for testing
        // in a node environment for accurate code coverage reporting.
        a[d] = d;
        return a;
    }),
};

module.exports = function(ext){
    // mixin the base config underneath the dev config object
    return Object.keys(base).reduce((acc, key) => {
        acc[key] = acc[key] === undefined ? base[key] : acc[key];
        return acc;
    }, ext);
};