'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.addColumn('Images', 'height', {
            type: Sequelize.INTEGER,
            field: 'height',
            allowNull: false,
            defaultValue: 1,
        });
    },

    down: (queryInterface /*, Sequelize */) => {
        return queryInterface.dropColumn('Images', 'height');
    },
};
