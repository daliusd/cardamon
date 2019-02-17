module.exports = {
    apps : [{
        name      : 'cardamon',
        script    : 'bin/www',

        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '500M',
        env: {
            NODE_ENV: 'development',
        },
        env_production : {
            NODE_ENV: 'production',
            PORT: 3002,
        },
    }],
};
