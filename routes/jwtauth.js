const jwt = require('jsonwebtoken');

const config = require('../config');
const RevokedToken = require('../models').RevokedToken;

const verifyToken = (req, res, next) => {
    let token = req.headers['authorization'];

    if (!token || !token.startsWith('Bearer ')) {
        return res.status(403).send({
            auth: false,
            message: 'No valid token provided.',
        });
    }

    token = token.substring(7);

    jwt.verify(token, config.secret, (err, decoded) => {
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

        RevokedToken.findOne({ where: { token } }).then(revokedToken => {
            if (revokedToken) {
                return res.status(401).send({
                    auth: false,
                });
            }

            req.user = decoded.id;
            req.admin = decoded.admin || false;
            next();
        });
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

    token = token.substring(7);

    jwt.verify(token, config.secret, (err, decoded) => {
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

        RevokedToken.findOne({ where: { token } }).then(revokedToken => {
            if (revokedToken) {
                return res.status(401).send({
                    auth: false,
                });
            }

            req.user = decoded.id;
            req.admin = decoded.admin;
            next();
        });
    });
};

const jwtauth = {};
jwtauth.verifyToken = verifyToken;
jwtauth.verifyRefreshToken = verifyRefreshToken;

module.exports = jwtauth;
