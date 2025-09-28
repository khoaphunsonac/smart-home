const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Room = sequelize.define('Room', {
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
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: [0, 200]
        },
        set(value) {
            if (value) this.setDataValue('description', value.trim());
        }
    },
    isOccupied: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    adaUsername: {
        type: DataTypes.STRING(50),
        allowNull: true,
        set(value) {
            if (value) this.setDataValue('adaUsername', value.trim());
        }
    },
    temperatureCurrent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        validate: {
            min: -50,
            max: 100
        }
    },
    temperatureTarget: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        validate: {
            min: -50,
            max: 100
        }
    },
    temperatureUnit: {
        type: DataTypes.ENUM('celsius', 'fahrenheit'),
        defaultValue: 'celsius',
        allowNull: false
    },
    humidityCurrent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        validate: {
            min: 0,
            max: 100
        }
    },
    humidityTarget: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        validate: {
            min: 0,
            max: 100
        }
    },
    lightingIsOn: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    lightingBrightness: {
        type: DataTypes.INTEGER,
        defaultValue: 50,
        allowNull: false,
        validate: {
            min: 0,
            max: 100
        }
    },
    lightingColor: {
        type: DataTypes.STRING(7),
        defaultValue: '#ffffff',
        allowNull: false,
        validate: {
            is: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
        }
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    },
    roomImage: {
        type: DataTypes.STRING(255),
        allowNull: true
    }
}, {
    tableName: 'rooms',
    indexes: [
        {
            fields: ['owner_id', 'is_active']
        },
        {
            fields: ['name']
        }
    ]
});

module.exports = Room;