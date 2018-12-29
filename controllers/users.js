const passwordHash = require('password-hash');
const jwt = require('jsonwebtoken');
const config = require('../config');

const User = require('../models').User;

module.exports = {
    async create(req, res) {
        try {
            const user = await User.create({
                username: req.body.username,
                password: passwordHash.generate(req.body.password),
            });

            const access_token = jwt.sign({ id: user.username }, config.secret, { expiresIn: 60 * 60 });
            const refresh_token = jwt.sign({ id: user.username, refresh: true }, config.secret, { expiresIn: 60 * 60 });

            return res.status(201).send({ access_token, refresh_token, message: `User ${user.username} was created.` });
        } catch (error) {
            return res.status(400).send(error);
        }
    },
};
