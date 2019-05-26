'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.addColumn('Images', 'width', {
            type: Sequelize.INTEGER,
            field: 'width',
            allowNull: false,
            defaultValue: 1,
        });
    },

    down: (queryInterface /*, Sequelize */) => {
        return queryInterface.dropColumn('Images', 'width');
    },
};
