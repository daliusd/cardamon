const crypto = require('crypto');

const Image = require('../models').Image;

module.exports = {
    async create(req, res) {
        const rnd = crypto.randomBytes(16).toString('hex');

        const image = await Image.create({
            type: req.file.mimetype,
            name: rnd + req.file.originalname,
            data: req.file.buffer,
            ownerId: null,
            global: false,
        });

        res.set('Content-Type', 'text/plain');
        res.status(201).send(image.id.toString());
    },
};
