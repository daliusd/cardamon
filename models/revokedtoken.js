'use strict';
module.exports = (sequelize, DataTypes) => {
    const RevokedToken = sequelize.define(
        'RevokedToken',
        {
            token: {
                type: DataTypes.STRING,
                allowNulls: false,
                unique: true,
            },
        },
        {},
    );
    RevokedToken.associate = function(/* models*/) {
        // associations can be defined here
    };
    return RevokedToken;
};