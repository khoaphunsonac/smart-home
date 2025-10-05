const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Device = sequelize.define('Device', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            len: [1, 100],
            notEmpty: true
        },
        set(value) {
            this.setDataValue('name', value.trim());
        }
    },
    type: {
        type: DataTypes.STRING(100),
        allowNull: false,
        set(value) {
            this.setDataValue('type', value.trim());
        }
    },
    isOn: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
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
    tableName: 'device',
    timestamps: false,
    underscored: false, // Không convert camelCase thành snake_case
    freezeTableName: true // Không pluralize table name
});

module.exports = Device;