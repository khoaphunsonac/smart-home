// BACKUP: Model hiện tại với field mappings mới
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UsageHistory = sequelize.define('UsageHistory', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    startTime: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'start_time'
    },
    endTime: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'end_time'
    },
    duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Duration in seconds'
    },
    deviceType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'device_type',
        comment: 'Type of device (Sensor, Light, AC, etc.)'
    },
    energyConsumed: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0,
        field: 'energyConsumed',
        comment: 'Energy consumed in kWh'
    },
    usageDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'usageDate'
    },
    room_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'room',
            key: 'id'
        }
    },
    user_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        references: {
            model: 'user',
            key: 'id'
        }
    }
}, {
    tableName: 'usagehistory',
    timestamps: false,
    underscored: false
});

module.exports = UsageHistory;
