const Game = require('../models').Game;
const Cardset = require('../models').Cardset;

module.exports = {
    async create(req, res) {
        const game = await Game.create({
            name: req.body.name,
            ownerId: req.user,
        });

        return res.status(201).send({ message: 'Game created', game_id: game.id.toString() });
    },

    async getAll(req, res) {
        const games = await Game.findAll({ where: { ownerId: req.user } });

        return res.status(200).send({ games: games.map(g => ({ id: g.id.toString(), name: g.name })) });
    },

    async getById(req, res) {
        const games = await Game.findAll({
            where: { id: req.params.id, ownerId: req.user },
            include: [{ model: Cardset, as: 'cardsets' }],
        });
        if (games.length === 0) {
            return res.status(404).send({ message: 'Game not found' });
        }
        const game = games[0];

        return res.status(200).send({
            id: game.id.toString(),
            name: game.name,
            cardsets: game.cardsets.map(cs => ({ id: cs.id.toString(), name: cs.name })),
        });
    },

    async update(req, res) {
        const games = await Game.findAll({
            where: { id: req.params.id, ownerId: req.user },
        });
        if (games.length === 0) {
            return res.status(404).send({ message: 'Game not found' });
        }
        const game = games[0];
        game.update({ name: req.body.name });

        return res.status(200).send({ message: 'Game updated' });
    },

    async destroy(req, res) {
        const games = await Game.findAll({
            where: { id: req.params.id, ownerId: req.user },
        });
        if (games.length === 0) {
            return res.status(404).send({ message: 'Game not found' });
        }
        const game = games[0];
        game.destroy();

        return res.status(200).send({ message: 'Game deleted' });
    },
};
