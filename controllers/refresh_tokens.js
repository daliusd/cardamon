const RevokedToken = require('../models').RevokedToken;

module.exports = {
    async delete(req, res) {
        const token = req.headers['authorization'].substring(7);
        await RevokedToken.create({ token });

        return res.status(200).send({ message: 'Refresh token has been revoked.' });
    },
};
