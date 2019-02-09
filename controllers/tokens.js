const jwt = require('jsonwebtoken');
const passwordHash = require('password-hash');

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
        const { username, password } = req.body;
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(404).send({ message: `User ${username} doesn't exists.` });
        }

        if (!passwordHash.verify(password, user.password)) {
            return res.status(400).send({ message: 'Wrong credentials.' });
        }

        const accessToken = createAccessToken(user.id);
        const refreshToken = createRefreshToken(user.id);

        return res.status(200).send({ accessToken, refreshToken, message: `Logged in as ${username}.` });
    },
};
