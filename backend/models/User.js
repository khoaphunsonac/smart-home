const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.STRING(50),
        primaryKey: true,
        allowNull: false
    },
    username: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            len: [3, 100],
            notEmpty: true
        },
        set(value) {
            this.setDataValue('username', value.toLowerCase().trim());
        }
    },
    pass: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            len: [6, 255],
            notEmpty: true
        }
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            len: [2, 100],
            notEmpty: true
        },
        set(value) {
            this.setDataValue('name', value.trim());
        }
    },
    birthday: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
            isDate: true
        }
    }
}, {
    tableName: 'user',
    timestamps: false,
    underscored: false, // Không convert camelCase thành snake_case
    freezeTableName: true, // Không pluralize table name
    hooks: {
        beforeSave: async (user) => {
            if (user.changed('pass')) {
                const salt = await bcrypt.genSalt(12);
                user.pass = await bcrypt.hash(user.pass, salt);
            }
        }
    }
});

// Instance methods
User.prototype.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.pass);
};

User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.pass;
    return values;
};

module.exports = User;