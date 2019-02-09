const Sequelize = require('sequelize');
const stream = require('stream');
const crypto = require('crypto');

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

        res.status(201).json({ message: 'Image uploaded successfully!', imageId: image.id });
    },

    async getAll(req, res) {
        let where = {};
        if (req.query.name) {
            where['name'] = { [Op.like]: `%${req.query.name}%` };
        }
        where[Op.or] = [{ global: { [Op.eq]: true } }, { ownerId: { [Op.eq]: req.user } }];
        const images = await Image.findAll({ where, attributes: ['id', 'name'], limit: 20 });
        res.json({ images });
    },

    async getByName(req, res) {
        const images = await Image.findAll({
            where: { name: req.params.name },
        });
        if (images.length === 0) {
            return res.status(404).send({ message: 'Image not found' });
        }
        const image = images[0];
        const hash = crypto
            .createHash('md5')
            .update(image.updatedAt.toString())
            .digest('hex');

        res.set('Etag', hash);
        if (req.get('if-none-match') === hash) {
            return res.status(304).send();
        }

        var fileContents = Buffer.from(image.data, 'base64');
        var readStream = new stream.PassThrough();
        readStream.end(fileContents);

        res.set('Content-disposition', 'attachment; filename=' + image.name);
        res.set('Content-Type', image.type);

        readStream.pipe(res);
    },

    async destroy(req, res) {
        const images = await Image.findAll({
            where: { id: req.params.id, ownerId: req.user },
        });
        if (images.length === 0) {
            return res.status(404).send({ message: 'Image not found' });
        }
        const image = images[0];
        image.destroy();

        return res.status(200).send({ message: 'Image deleted' });
    },
};
