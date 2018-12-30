const jwt = require('jsonwebtoken');
const config = require('../config');

const verifyToken = (req, res, next) => {
    let token = req.headers['authorization'];

    if (!token || !token.startsWith('Bearer ')) {
        return res.status(403).send({
            auth: false,
            message: 'No valid token provided.',
        });
    }

    jwt.verify(token.substring(7), config.secret, (err, decoded) => {
        if (err) {
            return res.status(500).send({
                auth: false,
                message: 'Fail to authenticate. Error -> ' + err,
            });
        }
        if (decoded.refresh) {
            return res.status(403).send({
                auth: false,
                message: 'No valid token provided.',
            });
        }
        req.user = decoded.id;
        next();
    });
};

const verifyRefreshToken = (req, res, next) => {
    let token = req.headers['authorization'];

    if (!token || !token.startsWith('Bearer ')) {
        return res.status(403).send({
            auth: false,
            message: 'No valid token provided.',
        });
    }

    jwt.verify(token.substring(7), config.secret, (err, decoded) => {
        if (err) {
            return res.status(500).send({
                auth: false,
                message: 'Fail to authenticate. Error -> ' + err,
            });
        }
        if (!decoded.refresh) {
            return res.status(403).send({
                auth: false,
                message: 'No valid token provided.',
            });
        }
        req.user = decoded.id;
        next();
    });
};

const jwtauth = {};
jwtauth.verifyToken = verifyToken;
jwtauth.verifyRefreshToken = verifyRefreshToken;

module.exports = jwtauth;
