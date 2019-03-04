'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.addColumn('Images', 'metadata', {
            type: Sequelize.JSON,
            field: 'metadata',
            allowNull: true,
        });
    },

    down: (queryInterface /*, Sequelize */) => {
        return queryInterface.dropColumn('Images', 'metadata');
    },
};
