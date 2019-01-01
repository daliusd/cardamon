const usersController = require('../controllers').users;
const tokensController = require('../controllers').tokens;
const accessTokensController = require('../controllers').access_tokens;
const refreshTokensController = require('../controllers').refresh_tokens;
const gamesController = require('../controllers').games;
const cardsetsController = require('../controllers').cardsets;
const imagesController = require('../controllers').images;

const upload = require('../config/multer.config.js');

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

    app.post('/api/games', [jwtauth.verifyToken], gamesController.create);
    app.get('/api/games', [jwtauth.verifyToken], gamesController.getAll);
    app.get('/api/games/:id', [jwtauth.verifyToken], gamesController.getById);
    app.put('/api/games/:id', [jwtauth.verifyToken], gamesController.update);
    app.delete('/api/games/:id', [jwtauth.verifyToken], gamesController.destroy);

    app.post('/api/cardsets', [jwtauth.verifyToken], cardsetsController.create);
    app.get('/api/cardsets/:id', [jwtauth.verifyToken], cardsetsController.getById);
    app.put('/api/cardsets/:id', [jwtauth.verifyToken], cardsetsController.update);
    app.delete('/api/cardsets/:id', [jwtauth.verifyToken], cardsetsController.destroy);

    app.post('/api/images', [jwtauth.verifyToken, upload.single('image')], imagesController.create);
    app.get('/api/images', [jwtauth.verifyToken], imagesController.getAll);
    app.get('/api/images/:id', [jwtauth.verifyToken], imagesController.getById);
    app.delete('/api/images/:id', [jwtauth.verifyToken], imagesController.destroy);
};
