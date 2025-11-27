const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EnvironmentData = sequelize.define('EnvironmentData', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    temperature: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    humidity: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    lightLevel: {
        type: DataTypes.FLOAT,
        allowNull: true,
        field: 'lightLevel'
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    room_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'room',
            key: 'id'
        }
    }
}, {
    tableName: 'environmentdata',
    timestamps: false
});

module.exports = EnvironmentData;