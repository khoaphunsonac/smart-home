const User = require('./User');
const Room = require('./Room');
const Device = require('./Device');

// Define associations
User.hasMany(Room, {
    foreignKey: 'ownerId',
    as: 'rooms'
});

Room.belongsTo(User, {
    foreignKey: 'ownerId',
    as: 'owner'
});

Room.hasMany(Device, {
    foreignKey: 'roomId',
    as: 'devices'
});

Device.belongsTo(Room, {
    foreignKey: 'roomId',
    as: 'room'
});

Device.belongsTo(User, {
    foreignKey: 'ownerId',
    as: 'owner'
});

User.hasMany(Device, {
    foreignKey: 'ownerId',
    as: 'devices'
});

module.exports = {
    User,
    Room,
    Device
};