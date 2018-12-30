const winston = require('winston');
const RevokedToken = require('../models').RevokedToken;

module.exports = {
    async delete(req, res) {
        try {
            const token = req.headers['authorization'].substring(7);
            await RevokedToken.create({ token });

            return res.status(200).send({ message: 'Refresh token has been revoked.' });
        } catch (error) {
            winston.log('error', error);
            return res.status(400).send({ message: 'Unexpected error.' });
        }
    },
};
