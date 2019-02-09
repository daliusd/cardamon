const Cardset = require('../models').Cardset;

module.exports = {
    async create(req, res) {
        const cardset = await Cardset.create({
            name: req.body.name,
            data: req.body.data,
            gameId: req.body.gameId,
            ownerId: req.user,
        });

        return res.status(201).send({ message: 'Card Set created', cardsetId: cardset.id.toString() });
    },

    async getById(req, res) {
        const cardsets = await Cardset.findAll({
            where: { id: req.params.id, ownerId: req.user },
        });
        if (cardsets.length === 0) {
            return res.status(404).send({ message: 'Card Set not found' });
        }
        const cardset = cardsets[0];

        return res.status(200).send({
            id: cardset.id.toString(),
            name: cardset.name,
            data: cardset.data,
            gameId: cardset.gameId.toString(),
        });
    },

    async update(req, res) {
        const cardsets = await Cardset.findAll({
            where: { id: req.params.id, ownerId: req.user },
        });
        if (cardsets.length === 0) {
            return res.status(404).send({ message: 'Card Set not found' });
        }
        const cardset = cardsets[0];
        cardset.update({ name: req.body.name, data: req.body.data });

        return res.status(200).send({ message: 'Card Set updated' });
    },

    async destroy(req, res) {
        const cardsets = await Cardset.findAll({
            where: { id: req.params.id, ownerId: req.user },
        });
        if (cardsets.length === 0) {
            return res.status(404).send({ message: 'Card Set not found' });
        }
        const cardset = cardsets[0];
        cardset.destroy();

        return res.status(200).send({ message: 'Card Set deleted' });
    },
};
