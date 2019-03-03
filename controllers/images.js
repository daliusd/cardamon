const Sequelize = require('sequelize');
const stream = require('stream');
const crypto = require('crypto');

const Image = require('../models').Image;

const Op = Sequelize.Op;

module.exports = {
    async create(req, res) {
        let name = req.body.name || req.file.originalname;
        if (req.body.global === undefined || req.body.global !== 'true') {
            const hash = crypto
                .createHash('md5')
                .update(`${req.body.gameId}`)
                .digest('hex');

            name += '_' + hash;
        }

        const images = await Image.findAll({
            where: { name: name },
        });
        if (images.length !== 0) {
            const image = images[0];

            await image.update({
                data: req.file.buffer,
            });

            return res.status(200).json({ message: 'Image re-uploaded successfully!', imageId: image.id });
        }

        const image = await Image.create({
            type: req.file.mimetype,
            name,
            data: req.file.buffer,
            ownerId: req.user,
            gameId: parseInt(req.body.gameId) || null,
            global: req.body.global === 'true',
        });

        res.status(201).json({ message: 'Image uploaded successfully!', imageId: image.id });
    },

    async getAll(req, res) {
        let where = {};
        if (req.query.name) {
            where['name'] = { [Op.iLike]: `%${req.query.name}%` };
        }
        if (req.query.location === 'game') {
            where['gameId'] = req.query.game;
            where['ownerId'] = req.user;
        } else if (req.query.location === 'user') {
            where['global'] = false;
            where['ownerId'] = req.user;
        } else {
            where[Op.or] = [{ global: { [Op.eq]: true } }, { ownerId: { [Op.eq]: req.user } }];
        }
        const images = await Image.findAll({ where, attributes: ['id', 'name'], limit: 100 });
        res.json({ images });
    },

    async update(req, res) {
        const images = await Image.findAll({
            where: { id: parseInt(req.params.id), [Op.or]: [{ ownerId: null }, { ownerId: req.user }] },
        });
        if (images.length === 0) {
            return res.status(404).send({ message: 'Image not found.' });
        }

        const image = images[0];

        const hash = crypto
            .createHash('md5')
            .update(`${req.user} ${req.gameId}`)
            .digest('hex');

        await image.update({
            name: hash + '_' + req.body.name,
            ownerId: req.user,
            gameId: req.body.gameId,
        });

        res.status(200).json({ message: 'Image updated successfully!' });
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
