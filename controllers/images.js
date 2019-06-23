const Sequelize = require('sequelize');
const stream = require('stream');
const crypto = require('crypto');
const sharp = require('sharp');

const Image = require('../models').Image;

const Op = Sequelize.Op;

const FORMAT_TO_MIMETYPE = {
    svg: 'image/svg+xml',
    png: 'image/png',
    jpeg: 'image/jpeg',
};

async function getResizedBuffer(input) {
    let image = sharp(input);
    const metadata = await image.metadata();

    if (metadata.format === 'svg') {
        return {
            buffer: input,
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
        };
    }

    if (metadata.width > 960) {
        image = await image.resize(960);
    }

    if (metadata.format !== 'jpeg') {
        image = await image.png();
    }

    image = await image.rotate();

    return {
        buffer: await image.toBuffer(),
        width: metadata.width,
        height: metadata.height,
        format: metadata.format === 'jpeg' ? 'jpeg' : 'png',
    };
}

module.exports = {
    async create(req, res) {
        let imageInfo = await getResizedBuffer(req.file.buffer);

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
                data: imageInfo.buffer,
                metadata: req.body.metadata,
                width: imageInfo.width,
                height: imageInfo.height,
            });

            return res.status(200).json({ message: 'Image re-uploaded successfully!', imageId: image.id });
        }

        const image = await Image.create({
            type: FORMAT_TO_MIMETYPE[imageInfo.format],
            name,
            data: imageInfo.buffer,
            ownerId: req.user,
            gameId: parseInt(req.body.gameId) || null,
            global: req.body.global === 'true',
            metadata: req.body.metadata,
            width: imageInfo.width,
            height: imageInfo.height,
        });

        res.status(201).json({ message: 'Image uploaded successfully!', imageId: image.id });
    },

    async getAll(req, res) {
        let where = {};
        if (req.query.name) {
            where['name'] = { [Op.iLike]: `%${req.query.name.replace(/ /g, '%')}%` };
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
        const images = await Image.findAll({
            where,
            attributes: ['id', 'name', 'width', 'height'],
            limit: 100,
        });
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

    async getByNameMetadata(req, res) {
        const images = await Image.findAll({
            where: { name: req.params.name },
            attributes: ['id', 'name', 'width', 'height', 'metadata', 'updatedAt'],
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

        res.json(image);
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
