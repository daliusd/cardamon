'use strict';
module.exports = (sequelize, DataTypes) => {
    const Image = sequelize.define(
        'Image',
        {
            name: DataTypes.STRING,
            type: DataTypes.STRING,
            data: DataTypes.BLOB,
            global: DataTypes.BOOLEAN,
            metadata: DataTypes.JSON,
            width: DataTypes.INTEGER,
            height: DataTypes.INTEGER,
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