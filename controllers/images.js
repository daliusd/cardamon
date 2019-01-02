const Sequelize = require('sequelize');
const stream = require('stream');

const Image = require('../models').Image;

const Op = Sequelize.Op;

module.exports = {
    async create(req, res) {
        const images = await Image.findAll({
            where: { name: req.body.name },
        });
        if (images.length !== 0) {
            return res.status(409).send({ message: 'Image with this name already exists' });
        }

        const image = await Image.create({
            type: req.file.mimetype,
            name: req.body.name,
            data: req.file.buffer,
            ownerId: req.user,
            global: req.body.global === 'true',
        });

        res.status(201).json({ message: 'Image uploaded successfully!', image_id: image.id });
    },

    async getAll(req, res) {
        try {
            let where = {};
            if (req.query.name) {
                where['name'] = { [Op.like]: `%${req.query.name}%` };
            }
            const images = await Image.findAll({ where, attributes: ['id', 'name'] });
            res.json({ images });
        } catch (error) {
            throw error;
        }
    },

    async getById(req, res) {
        try {
            const images = await Image.findAll({
                where: { id: req.params.id, ownerId: req.user },
            });
            if (images.length === 0) {
                return res.status(404).send({ message: 'Image not found' });
            }
            const image = images[0];

            var fileContents = Buffer.from(image.data, 'base64');
            var readStream = new stream.PassThrough();
            readStream.end(fileContents);

            res.set('Content-disposition', 'attachment; filename=' + image.name);
            res.set('Content-Type', image.type);

            readStream.pipe(res);
        } catch (error) {
            throw error;
        }
    },

    async destroy(req, res) {
        try {
            const images = await Image.findAll({
                where: { id: req.params.id, ownerId: req.user },
            });
            if (images.length === 0) {
                return res.status(404).send({ message: 'Game not found' });
            }
            const image = images[0];
            image.destroy();

            return res.status(200).send({ message: 'Image deleted' });
        } catch (error) {
            throw error;
        }
    },
};
