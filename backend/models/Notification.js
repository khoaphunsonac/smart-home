const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id'
    },
    message: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'message'
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'timestamp'
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        field: 'IsRead'
    },
    user_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'user_id',
        references: {
            model: 'user',
            key: 'id'
        }
    }
}, {
    tableName: 'notification',
    timestamps: false,
    underscored: false
});

module.exports = Notification;