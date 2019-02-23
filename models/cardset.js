'use strict';
module.exports = (sequelize, DataTypes) => {
    const Cardset = sequelize.define(
        'Cardset',
        {
            name: {
                type: DataTypes.STRING,
                allowNulls: false,
            },
            data: {
                type: DataTypes.JSON,
                allowNulls: false,
            },
        },
        {},
    );
    Cardset.associate = function(models) {
        Cardset.belongsTo(models.User, {
            foreignKey: 'ownerId',
            onDelete: 'CASCADE',
            as: 'owner',
        });
        Cardset.belongsTo(models.Game, {
            foreignKey: 'gameId',
            onDelete: 'CASCADE',
        });
    };
    return Cardset;
};