const RevokedToken = require('../models').RevokedToken;

const tokens = require('./tokens');

module.exports = {
    async create(req, res) {
        const access_token = tokens.createAccessToken(req.user);
        return res.status(200).send({ access_token });
    },
    async delete(req, res) {
        const token = req.headers['authorization'].substring(7);
        await RevokedToken.create({ token });

        return res.status(200).send({ message: 'Access token has been revoked.' });
    },
};
