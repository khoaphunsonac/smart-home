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
        allowNull: false
    },
    endTime: {
        type: DataTypes.DATE,
        allowNull: true
    },
    duration: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Duration in minutes'
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
    timestamps: false
});

module.exports = UsageHistory;