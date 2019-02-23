'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.addColumn('Users', 'admin', {
            type: Sequelize.BOOLEAN,
            field: 'admin',
            defaultValue: false,
            allowNulls: false,
        });
    },

    down: (queryInterface /*, Sequelize */) => {
        return queryInterface.dropColumn('Users', 'admin');
    },
};
