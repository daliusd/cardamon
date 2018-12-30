const usersController = require('../controllers').users;
const tokensController = require('../controllers').tokens;
const accessTokensController = require('../controllers').access_tokens;
const jwtauth = require('./jwtauth');

module.exports = app => {
    app.get('/api', (req, res) =>
        res.status(200).send({
            message: 'Welcome to the Cardamon API!',
        }),
    );

    app.post('/api/users', usersController.create);
    app.post('/api/tokens', tokensController.create);
    app.post('/api/access_tokens', [jwtauth.verifyRefreshToken], accessTokensController.create);
};
