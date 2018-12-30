const passwordHash = require('password-hash');
const winston = require('winston');

const tokens = require('./tokens');

const User = require('../models').User;

module.exports = {
    async create(req, res) {
        try {
            const { username } = req.body;
            const existingUser = await User.findOne({ where: { username } });
            if (existingUser) {
                return res.status(409).send({ message: `User ${username} already exists.` });
            }

            await User.create({
                username,
                password: passwordHash.generate(req.body.password),
            });

            const access_token = tokens.createAccessToken(username);
            const refresh_token = tokens.createRefreshToken(username);

            return res.status(201).send({ access_token, refresh_token, message: `User ${username} was created.` });
        } catch (error) {
            winston.log('error', error);
            return res.status(400).send({ message: 'Unexpected error.' });
        }
    },
};
