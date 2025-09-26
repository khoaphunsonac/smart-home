const express = require('express');
const { Room, Device, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { validateRoomCreation, validateRoomUpdate, validateId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// @desc    Get all rooms for current user
// @route   GET /api/rooms
// @access  Private
router.get('/', validatePagination, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const rooms = await Room.findAll({
            where: {
                ownerId: req.user.id,
                isActive: true
            },
            include: [
                {
                    model: Device,
                    as: 'devices',
                    attributes: ['id', 'name', 'type', 'statusIsOn', 'statusIsOnline']
                },
                {
                    model: User,
                    as: 'owner',
                    attributes: ['id', 'name', 'username']
                }
            ],
            order: [['createdAt', 'DESC']],
            offset: skip,
            limit: limit
        });

        const total = await Room.count({
            where: {
                ownerId: req.user.id,
                isActive: true
            }
        });

        res.json({
            success: true,
            data: {
                rooms,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get rooms',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Get room by ID
// @route   GET /api/rooms/:id
// @access  Private
router.get('/:id', validateId, async (req, res) => {
    try {
        const room = await Room.findOne({
            where: {
                id: req.params.id,
                ownerId: req.user.id,
                isActive: true
            },
            include: [
                {
                    model: Device,
                    as: 'devices'
                },
                {
                    model: User,
                    as: 'owner',
                    attributes: ['id', 'name', 'username']
                }
            ]
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        res.json({
            success: true,
            data: { room }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get room',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Create new room
// @route   POST /api/rooms
// @access  Private
router.post('/', validateRoomCreation, async (req, res) => {
    try {
        const { name, description, adaUsername, temperature, humidity, lighting } = req.body;

        const roomData = {
            name,
            description,
            adaUsername,
            ownerId: req.user.id
        };

        // Handle temperature data
        if (temperature) {
            if (temperature.target !== undefined) roomData.temperatureTarget = temperature.target;
            if (temperature.current !== undefined) roomData.temperatureCurrent = temperature.current;
            if (temperature.unit !== undefined) roomData.temperatureUnit = temperature.unit;
        }

        // Handle humidity data
        if (humidity) {
            if (humidity.target !== undefined) roomData.humidityTarget = humidity.target;
            if (humidity.current !== undefined) roomData.humidityCurrent = humidity.current;
        }

        // Handle lighting data
        if (lighting) {
            if (lighting.isOn !== undefined) roomData.lightingIsOn = lighting.isOn;
            if (lighting.brightness !== undefined) roomData.lightingBrightness = lighting.brightness;
            if (lighting.color !== undefined) roomData.lightingColor = lighting.color;
        }

        const room = await Room.create(roomData);

        const populatedRoom = await Room.findByPk(room.id, {
            include: [{
                model: User,
                as: 'owner',
                attributes: ['id', 'name', 'username']
            }]
        });

        res.status(201).json({
            success: true,
            message: 'Room created successfully',
            data: { room: populatedRoom }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create room',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Update room
// @route   PUT /api/rooms/:id
// @access  Private
router.put('/:id', validateRoomUpdate, async (req, res) => {
    try {
        const { name, description, isOccupied, adaUsername, temperature, humidity, lighting } = req.body;

        const room = await Room.findOneAndUpdate(
            {
                _id: req.params.id,
                owner: req.user._id,
                isActive: true
            },
            {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(isOccupied !== undefined && { isOccupied }),
                ...(adaUsername !== undefined && { adaUsername }),
                ...(temperature && { temperature: { ...temperature } }),
                ...(humidity && { humidity: { ...humidity } }),
                ...(lighting && { lighting: { ...lighting } })
            },
            { new: true, runValidators: true }
        )
            .populate('devices')
            .populate('owner', 'name username');

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        res.json({
            success: true,
            message: 'Room updated successfully',
            data: { room }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update room',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Delete room (soft delete)
// @route   DELETE /api/rooms/:id
// @access  Private
router.delete('/:id', validateId, async (req, res) => {
    try {
        const room = await Room.findOneAndUpdate(
            {
                _id: req.params.id,
                owner: req.user._id,
                isActive: true
            },
            { isActive: false },
            { new: true }
        );

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Also deactivate all devices in the room
        await Device.updateMany(
            { room: req.params.id },
            { isActive: false }
        );

        res.json({
            success: true,
            message: 'Room deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete room',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Get room statistics
// @route   GET /api/rooms/:id/stats
// @access  Private
router.get('/:id/stats', validateId, async (req, res) => {
    try {
        const room = await Room.findOne({
            _id: req.params.id,
            owner: req.user._id,
            isActive: true
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        const deviceStats = await Device.aggregate([
            { $match: { room: room._id, isActive: true } },
            {
                $group: {
                    _id: null,
                    totalDevices: { $sum: 1 },
                    onlineDevices: {
                        $sum: { $cond: ['$status.isOnline', 1, 0] }
                    },
                    activeDevices: {
                        $sum: { $cond: ['$status.isOn', 1, 0] }
                    },
                    totalPowerConsumption: {
                        $sum: '$powerConsumption.current'
                    },
                    deviceTypes: {
                        $push: '$type'
                    }
                }
            }
        ]);

        const stats = deviceStats[0] || {
            totalDevices: 0,
            onlineDevices: 0,
            activeDevices: 0,
            totalPowerConsumption: 0,
            deviceTypes: []
        };

        // Count devices by type
        const deviceTypeCount = stats.deviceTypes.reduce((acc, type) => {
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});

        res.json({
            success: true,
            data: {
                room: {
                    id: room._id,
                    name: room.name,
                    isOccupied: room.isOccupied
                },
                stats: {
                    ...stats,
                    deviceTypeCount,
                    deviceTypes: undefined // Remove the array as we have the count object
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get room statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;