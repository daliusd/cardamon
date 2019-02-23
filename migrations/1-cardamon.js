'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "RevokedTokens", deps: []
 * createTable "Users", deps: []
 * createTable "Games", deps: [Users]
 * createTable "Cardsets", deps: [Users, Games]
 * createTable "Images", deps: [Users]
 *
 **/

var info = {
    revision: 1,
    name: 'cardamon',
    created: '2019-02-23T16:06:03.092Z',
    comment: '',
};

var migrationCommands = [
    {
        fn: 'createTable',
        params: [
            'RevokedTokens',
            {
                id: {
                    type: Sequelize.INTEGER,
                    field: 'id',
                    autoIncrement: true,
                    primaryKey: true,
                    allowNull: false,
                },
                token: {
                    type: Sequelize.STRING,
                    field: 'token',
                    unique: true,
                    allowNulls: false,
                },
                createdAt: {
                    type: Sequelize.DATE,
                    field: 'createdAt',
                    allowNull: false,
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    field: 'updatedAt',
                    allowNull: false,
                },
            },
            {},
        ],
    },
    {
        fn: 'createTable',
        params: [
            'Users',
            {
                id: {
                    type: Sequelize.INTEGER,
                    field: 'id',
                    autoIncrement: true,
                    primaryKey: true,
                    allowNull: false,
                },
                username: {
                    type: Sequelize.STRING,
                    field: 'username',
                    unique: true,
                    allowNulls: false,
                },
                password: {
                    type: Sequelize.STRING,
                    field: 'password',
                    allowNulls: false,
                },
                createdAt: {
                    type: Sequelize.DATE,
                    field: 'createdAt',
                    allowNull: false,
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    field: 'updatedAt',
                    allowNull: false,
                },
            },
            {},
        ],
    },
    {
        fn: 'createTable',
        params: [
            'Games',
            {
                id: {
                    type: Sequelize.INTEGER,
                    field: 'id',
                    autoIncrement: true,
                    primaryKey: true,
                    allowNull: false,
                },
                name: {
                    type: Sequelize.STRING,
                    field: 'name',
                    allowNulls: false,
                },
                createdAt: {
                    type: Sequelize.DATE,
                    field: 'createdAt',
                    allowNull: false,
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    field: 'updatedAt',
                    allowNull: false,
                },
                ownerId: {
                    type: Sequelize.INTEGER,
                    field: 'ownerId',
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                    references: {
                        model: 'Users',
                        key: 'id',
                    },
                    allowNull: true,
                },
            },
            {},
        ],
    },
    {
        fn: 'createTable',
        params: [
            'Cardsets',
            {
                id: {
                    type: Sequelize.INTEGER,
                    field: 'id',
                    autoIncrement: true,
                    primaryKey: true,
                    allowNull: false,
                },
                name: {
                    type: Sequelize.STRING,
                    field: 'name',
                    allowNulls: false,
                },
                data: {
                    type: Sequelize.JSON,
                    field: 'data',
                    allowNulls: false,
                },
                createdAt: {
                    type: Sequelize.DATE,
                    field: 'createdAt',
                    allowNull: false,
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    field: 'updatedAt',
                    allowNull: false,
                },
                ownerId: {
                    type: Sequelize.INTEGER,
                    field: 'ownerId',
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                    references: {
                        model: 'Users',
                        key: 'id',
                    },
                    allowNull: true,
                },
                gameId: {
                    type: Sequelize.INTEGER,
                    field: 'gameId',
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                    references: {
                        model: 'Games',
                        key: 'id',
                    },
                    allowNull: true,
                },
            },
            {},
        ],
    },
    {
        fn: 'createTable',
        params: [
            'Images',
            {
                id: {
                    type: Sequelize.INTEGER,
                    field: 'id',
                    autoIncrement: true,
                    primaryKey: true,
                    allowNull: false,
                },
                name: {
                    type: Sequelize.STRING,
                    field: 'name',
                },
                type: {
                    type: Sequelize.STRING,
                    field: 'type',
                },
                data: {
                    type: Sequelize.BLOB,
                    field: 'data',
                },
                global: {
                    type: Sequelize.BOOLEAN,
                    field: 'global',
                },
                createdAt: {
                    type: Sequelize.DATE,
                    field: 'createdAt',
                    allowNull: false,
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    field: 'updatedAt',
                    allowNull: false,
                },
                ownerId: {
                    type: Sequelize.INTEGER,
                    field: 'ownerId',
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                    references: {
                        model: 'Users',
                        key: 'id',
                    },
                    allowNull: true,
                },
            },
            {},
        ],
    },
];

module.exports = {
    pos: 0,
    up: function(queryInterface /*, Sequelize */) {
        var index = this.pos;
        return new Promise(function(resolve, reject) {
            function next() {
                if (index < migrationCommands.length) {
                    let command = migrationCommands[index];
                    index++;
                    queryInterface[command.fn].apply(queryInterface, command.params).then(next, reject);
                } else resolve();
            }
            next();
        });
    },
    info: info,
};
