'use strict';
module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define(
        'User',
        {
            username: {
                type: DataTypes.STRING,
                allowNulls: false,
            },
            password: {
                type: DataTypes.STRING,
                allowNulls: false,
            },
        },
        {},
    );
    User.associate = function(models) {
        User.hasMany(models.Game, {
            foreignKey: 'ownerId',
            as: 'games',
        });
        User.hasMany(models.Cardset, {
            foreignKey: 'ownerId',
            as: 'cardsets',
        });
        // associations can be defined here
    };
    return User;
};