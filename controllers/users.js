const passwordHash = require('password-hash');

const tokens = require('./tokens');

const User = require('../models').User;

module.exports = {
    async create(req, res) {
        const { username } = req.body;
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(409).send({ message: `User ${username} already exists.` });
        }

        const user = await User.create({
            username,
            password: passwordHash.generate(req.body.password),
        });

        const accessToken = tokens.createAccessToken(user.id);
        const refreshToken = tokens.createRefreshToken(user.id);

        return res.status(201).send({ accessToken, refreshToken, message: `User ${username} was created.` });
    },
};
