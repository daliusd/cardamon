const passwordHash = require('password-hash');
const jwt = require('jsonwebtoken');
const config = require('../config');

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

            const access_token = jwt.sign({ id: username }, config.secret, { expiresIn: 60 * 60 });
            const refresh_token = jwt.sign({ id: username, refresh: true }, config.secret, {
                expiresIn: 365 * 24 * 60 * 60,
            });

            return res.status(201).send({ access_token, refresh_token, message: `User ${username} was created.` });
        } catch (error) {
            return res.status(400).send(error);
        }
    },
};
