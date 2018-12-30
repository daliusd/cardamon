const Cardset = require('../models').Cardset;

module.exports = {
    async create(req, res) {
        try {
            const cardset = await Cardset.create({
                name: req.body.name,
                data: req.body.data,
                gameId: req.body.game_id,
                ownerId: req.user,
            });

            return res.status(201).send({ message: 'Card Set created', cardset_id: cardset.id.toString() });
        } catch (error) {
            throw error;
        }
    },

    async getById(req, res) {
        try {
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
                game_id: cardset.gameId.toString(),
            });
        } catch (error) {
            throw error;
        }
    },

    async update(req, res) {
        try {
            const cardsets = await Cardset.findAll({
                where: { id: req.params.id, ownerId: req.user },
            });
            if (cardsets.length === 0) {
                return res.status(404).send({ message: 'Card Set not found' });
            }
            const cardset = cardsets[0];
            cardset.update({ name: req.body.name, data: req.body.data });

            return res.status(200).send({ message: 'Card Set updated' });
        } catch (error) {
            throw error;
        }
    },

    async destroy(req, res) {
        try {
            const cardsets = await Cardset.findAll({
                where: { id: req.params.id, ownerId: req.user },
            });
            if (cardsets.length === 0) {
                return res.status(404).send({ message: 'Card Set not found' });
            }
            const cardset = cardsets[0];
            cardset.destroy();

            return res.status(200).send({ message: 'Card Set deleted' });
        } catch (error) {
            throw error;
        }
    },
};
