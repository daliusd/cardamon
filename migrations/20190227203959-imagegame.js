'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.addColumn('Images', 'gameId', {
            type: Sequelize.INTEGER,
            field: 'gameId',
            onDelete: 'CASCADE',
            references: {
                model: 'Games',
                key: 'id',
            },
            allowNull: true,
        });
    },

    down: (queryInterface /*, Sequelize */) => {
        return queryInterface.dropColumn('Images', 'gameId');
    },
};
