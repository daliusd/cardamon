'use strict';
module.exports = (sequelize, DataTypes) => {
    const Image = sequelize.define(
        'Image',
        {
            name: DataTypes.STRING,
            type: DataTypes.STRING,
            data: DataTypes.BLOB,
            global: DataTypes.BOOLEAN,
        },
        {},
    );
    Image.associate = function(models) {
        Image.belongsTo(models.User, {
            foreignKey: 'ownerId',
            onDelete: 'CASCADE',
        });
    };
    Image.associate = function(models) {
        Image.belongsTo(models.Game, {
            foreignKey: 'gameId',
            onDelete: 'CASCADE',
        });
    };
    return Image;
};