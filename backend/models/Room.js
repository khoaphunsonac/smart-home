const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Room = sequelize.define(
    "Room",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                len: [1, 100],
                notEmpty: true,
            },
            set(value) {
                this.setDataValue("name", value.trim());
            },
        },
        isOccupied: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
        user_id: {
            type: DataTypes.STRING(50),
            allowNull: false,
            references: {
                model: "user",
                key: "id",
            },
        },
    },
    {
        tableName: "room",
        timestamps: false,
        underscored: false, // Không convert camelCase thành snake_case
        freezeTableName: true, // Không pluralize table name
    }
);

module.exports = Room;
