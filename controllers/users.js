var passwordHash = require('password-hash');

const User = require('../models').User;

module.exports = {
    async create(req, res) {
        try {
            const user = await User.create({
                username: req.body.username,
                password: passwordHash.generate(req.body.password),
            });

            return res.status(201).send(user);
        } catch (error) {
            return res.status(400).send(error);
        }
    },
};
