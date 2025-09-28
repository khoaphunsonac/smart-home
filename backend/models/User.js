const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        validate: {
            len: [3, 20],
            notEmpty: true,
            isAlphanumeric: true
        },
        set(value) {
            this.setDataValue('username', value.toLowerCase().trim());
        }
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
            notEmpty: true
        },
        set(value) {
            this.setDataValue('email', value.toLowerCase().trim());
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            len: [6, 255],
            notEmpty: true
        }
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            len: [2, 50],
            notEmpty: true
        },
        set(value) {
            this.setDataValue('name', value.trim());
        }
    },
    birthday: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            isDate: true,
            notEmpty: true
        }
    },
    avatar: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    role: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user',
        allowNull: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    },
    lastLogin: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'users',
    hooks: {
        beforeSave: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(12);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

// Instance methods
User.prototype.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password;
    return values;
};

module.exports = User;