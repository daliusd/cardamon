module.exports = {
    apps : [{
        name      : 'Cardamon',
        script    : 'bin/www',
        env: {
            NODE_ENV: 'development',
        },
        env_production : {
            NODE_ENV: 'production',
            PORT: 3002,
        },
    }],
};
