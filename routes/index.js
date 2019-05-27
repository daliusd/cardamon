const usersController = require('../controllers').users;
const tokensController = require('../controllers').tokens;
const accessTokensController = require('../controllers').access_tokens;
const refreshTokensController = require('../controllers').refresh_tokens;
const gamesController = require('../controllers').games;
const cardsetsController = require('../controllers').cardsets;
const imagesController = require('../controllers').images;
const reportsController = require('../controllers').reports;

const upload = require('../config/multer.config.js');

const jwtauth = require('./jwtauth');

const awaitHandlerFactory = middleware => {
    return async (req, res, next) => {
        try {
            await middleware(req, res, next);
        } catch (err) {
            next(err);
        }
    };
};

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

    app.post('/api/users', awaitHandlerFactory(usersController.create));
    app.post('/api/tokens', awaitHandlerFactory(tokensController.create));
    app.post('/api/access_tokens', [jwtauth.verifyRefreshToken], awaitHandlerFactory(accessTokensController.create));
    app.delete('/api/access_tokens', [jwtauth.verifyToken], awaitHandlerFactory(accessTokensController.delete));
    app.delete(
        '/api/refresh_tokens',
        [jwtauth.verifyRefreshToken],
        awaitHandlerFactory(refreshTokensController.delete),
    );

    app.post('/api/games', [jwtauth.verifyToken], awaitHandlerFactory(gamesController.create));
    app.get('/api/games', [jwtauth.verifyToken], awaitHandlerFactory(gamesController.getAll));
    app.get('/api/games/:id', [jwtauth.verifyToken], awaitHandlerFactory(gamesController.getById));
    app.put('/api/games/:id', [jwtauth.verifyToken], awaitHandlerFactory(gamesController.update));
    app.delete('/api/games/:id', [jwtauth.verifyToken], awaitHandlerFactory(gamesController.destroy));

    app.post('/api/cardsets', [jwtauth.verifyToken], awaitHandlerFactory(cardsetsController.create));
    app.get('/api/cardsets/:id', [jwtauth.verifyToken], awaitHandlerFactory(cardsetsController.getById));
    app.put('/api/cardsets/:id', [jwtauth.verifyToken], awaitHandlerFactory(cardsetsController.update));
    app.delete('/api/cardsets/:id', [jwtauth.verifyToken], awaitHandlerFactory(cardsetsController.destroy));

    app.post('/api/images/:id', [jwtauth.verifyToken], awaitHandlerFactory(imagesController.update));
    app.post(
        '/api/images',
        [jwtauth.verifyToken, upload.single('image')],
        awaitHandlerFactory(imagesController.create),
    );
    app.get('/api/images', [jwtauth.verifyToken], awaitHandlerFactory(imagesController.getAll));
    app.delete('/api/images/:id', [jwtauth.verifyToken], awaitHandlerFactory(imagesController.destroy));

    app.get('/api/imagefiles/:name', awaitHandlerFactory(imagesController.getByName));

    app.post('/api/reports', awaitHandlerFactory(reportsController.create));
};
