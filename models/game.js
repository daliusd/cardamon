'use strict';
module.exports = (sequelize, DataTypes) => {
    const Game = sequelize.define(
        'Game',
        {
            name: {
                type: DataTypes.STRING,
                allowNulls: false,
            },
        },
        {},
    );
    Game.associate = function(models) {
        Game.hasMany(models.Cardset, {
            foreignKey: 'gameId',
            as: 'cardsets',
        });
        Game.belongsTo(models.User, {
            foreignKey: 'ownerId',
            onDelete: 'CASCADE',
            as: 'owner',
        });
    };
    return Game;
};