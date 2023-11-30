if (process.env.NODE_ENV === "production") {
    module.exports = {
        publicPath: '/aoc',
        configureWebpack: {}
    }
}
else {
    module.exports = {
        configureWebpack: {
            devtool: 'source-map'
        }
    }
}

module.exports = {
    ...module.exports,
    css: {
        loaderOptions: {
            sass: {
                data: `
                @import "@/style/variables.scss";
                @import "@/style/media.scss";
                `
            }
        }
    },
    configureWebpack: {
        ...module.exports.configureWebpack,
        module: {
            rules: [
                {
                    test: /\.txt$/i,
                    use: 'raw-loader'
                }
            ]
        },
    },
    chainWebpack: (config) => {
        config.plugins.store.delete('prefetch');
        config.plugins.store.delete('preload');
    }
}
