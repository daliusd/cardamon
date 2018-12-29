module.exports = {
    env: {
        es6: true,
        node: true,
    },
    extends: ['eslint:recommended', 'plugin:jest/recommended'],
    parser: 'babel-eslint',
    parserOptions: {
        ecmaVersion: 2015,
    },
    rules: {
        indent: ['error', 4],
        'linebreak-style': ['error', 'unix'],
        quotes: ['error', 'single'],
        semi: ['error', 'always'],
    },
    plugins: ['jest'],
};