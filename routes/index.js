const usersController = require('../controllers').users;
const tokensController = require('../controllers').tokens;
const accessTokensController = require('../controllers').access_tokens;
const refreshTokensController = require('../controllers').refresh_tokens;

const jwtauth = require('./jwtauth');

module.exports = app => {
    app.get('/api', (req, res) =>
        res.status(200).send({
            message: 'Welcome to the Cardamon API!',
        }),
    );

    app.get('/api/auth', [jwtauth.verifyToken], (req, res) =>
        res.status(200).send({
            message: 'Auth request works.',
        }),
    );

    app.post('/api/users', usersController.create);
    app.post('/api/tokens', tokensController.create);
    app.post('/api/access_tokens', [jwtauth.verifyRefreshToken], accessTokensController.create);
    app.delete('/api/access_tokens', [jwtauth.verifyToken], accessTokensController.delete);
    app.delete('/api/refresh_tokens', [jwtauth.verifyRefreshToken], refreshTokensController.delete);
};
