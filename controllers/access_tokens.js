const tokens = require('./tokens');

module.exports = {
    create(req, res) {
        const access_token = tokens.createAccessToken(req.user);
        return res.status(200).send({ access_token });
    },
};
