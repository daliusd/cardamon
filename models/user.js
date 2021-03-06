'use strict';
module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define(
        'User',
        {
            username: {
                type: DataTypes.STRING,
                allowNulls: false,
                unique: true,
            },
            password: {
                type: DataTypes.STRING,
                allowNulls: false,
            },
            admin: {
                type: DataTypes.BOOLEAN,
                allowNulls: false,
                defaultValue: false,
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
        User.hasMany(models.Image, {
            foreignKey: 'ownerId',
            as: 'images',
        });
        // associations can be defined here
    };
    return User;
};