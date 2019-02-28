const crypto = require('crypto');

const Image = require('../models').Image;

module.exports = {
    async create(req, res) {
        const hash = crypto
            .createHash('md5')
            .update(`${req.user} ${req.body.gameId}`)
            .digest('hex');

        const image = await Image.create({
            type: req.file.mimetype,
            name: hash + '_' + req.file.originalname,
            data: req.file.buffer,
            gameId: req.body.gameId,
            ownerId: req.user,
            global: false,
        });

        res.set('Content-Type', 'text/plain');
        res.status(201).send(image.id.toString());
    },
};
