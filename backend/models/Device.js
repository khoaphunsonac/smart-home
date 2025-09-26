const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Device = sequelize.define('Device', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            len: [1, 50],
            notEmpty: true
        },
        set(value) {
            this.setDataValue('name', value.trim());
        }
    },
    type: {
        type: DataTypes.ENUM(
            'light',
            'fan',
            'air_conditioner',
            'heater',
            'speaker',
            'tv',
            'camera',
            'sensor',
            'switch',
            'thermostat',
            'humidifier',
            'dehumidifier',
            'other'
        ),
        allowNull: false
    },
    brand: {
        type: DataTypes.STRING(30),
        allowNull: true,
        set(value) {
            if (value) this.setDataValue('brand', value.trim());
        }
    },
    model: {
        type: DataTypes.STRING(50),
        allowNull: true,
        set(value) {
            if (value) this.setDataValue('model', value.trim());
        }
    },
    roomId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'rooms',
            key: 'id'
        }
    },
    ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    statusIsOnline: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    statusIsOn: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    statusLastSeen: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    },
    // Properties stored as JSON
    brightness: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 0,
            max: 100
        }
    },
    color: {
        type: DataTypes.STRING(7),
        allowNull: true,
        validate: {
            is: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
        }
    },
    speed: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 0,
            max: 100
        }
    },
    temperature: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        validate: {
            min: -50,
            max: 100
        }
    },
    volume: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 0,
            max: 100
        }
    },
    channel: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    // Power consumption
    powerConsumptionCurrent: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false,
        validate: {
            min: 0
        }
    },
    powerConsumptionDaily: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false,
        validate: {
            min: 0
        }
    },
    powerConsumptionMonthly: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false,
        validate: {
            min: 0
        }
    },
    // Schedule stored as JSON
    schedule: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    }
}, {
    tableName: 'devices',
    indexes: [
        {
            fields: ['room_id', 'is_active']
        },
        {
            fields: ['owner_id', 'type']
        },
        {
            fields: ['status_is_online']
        }
    ]
});

module.exports = Device;