const jwt = require('jsonwebtoken');
const passwordHash = require('password-hash');
const winston = require('winston');

const config = require('../config');

const User = require('../models').User;

const createAccessToken = userId => {
    return jwt.sign({ id: userId }, config.secret, { expiresIn: 60 * 60 });
};

const createRefreshToken = userId => {
    return jwt.sign({ id: userId, refresh: true }, config.secret, { expiresIn: 365 * 24 * 60 * 60 });
};

module.exports = {
    createAccessToken,
    createRefreshToken,
    async create(req, res) {
        try {
            const { username, password } = req.body;
            const user = await User.findOne({ where: { username } });
            if (!user) {
                return res.status(404).send({ message: `User ${username} doesn't exists.` });
            }

            if (!passwordHash.verify(password, user.password)) {
                return res.status(400).send({ message: 'Wrong credentials.' });
            }

            const access_token = createAccessToken(user.id);
            const refresh_token = createRefreshToken(user.id);

            return res.status(200).send({ access_token, refresh_token, message: `Logged in as ${username}.` });
        } catch (error) {
            winston.log('error', error);
            return res.status(400).send({ message: 'Unexpected error.' });
        }
    },
};
