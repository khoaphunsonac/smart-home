const User = require('./User');
const Room = require('./Room');
const Device = require('./Device');
const EnvironmentData = require('./EnvironmentData');
const Notification = require('./Notification');
const UsageHistory = require('./UsageHistory');

// Define associations

// User associations
User.hasMany(Room, {
    foreignKey: 'user_id',
    as: 'rooms'
});

User.hasMany(Notification, {
    foreignKey: 'user_id',
    as: 'notifications'
});

User.hasMany(UsageHistory, {
    foreignKey: 'user_id',
    as: 'usageHistories'
});

// Room associations
Room.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'owner'
});

Room.hasMany(Device, {
    foreignKey: 'room_id',
    as: 'devices'
});

Room.hasMany(EnvironmentData, {
    foreignKey: 'room_id',
    as: 'environmentData'
});

Room.hasMany(UsageHistory, {
    foreignKey: 'room_id',
    as: 'usageHistories'
});

// Device associations
Device.belongsTo(Room, {
    foreignKey: 'room_id',
    as: 'room'
});

// EnvironmentData associations
EnvironmentData.belongsTo(Room, {
    foreignKey: 'room_id',
    as: 'room'
});

// Notification associations
Notification.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

// UsageHistory associations
UsageHistory.belongsTo(Room, {
    foreignKey: 'room_id',
    as: 'room'
});

UsageHistory.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

module.exports = {
    User,
    Room,
    Device,
    EnvironmentData,
    Notification,
    UsageHistory
};