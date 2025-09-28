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

        const room = await Room.findOne({
            where: {
                id: req.params.id,
                ownerId: req.user.id,
                isActive: true
            }
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (isOccupied !== undefined) updateData.isOccupied = isOccupied;
        if (adaUsername !== undefined) updateData.adaUsername = adaUsername;

        // Handle temperature updates
        if (temperature) {
            if (temperature.target !== undefined) updateData.temperatureTarget = temperature.target;
            if (temperature.current !== undefined) updateData.temperatureCurrent = temperature.current;
            if (temperature.unit !== undefined) updateData.temperatureUnit = temperature.unit;
        }

        // Handle humidity updates
        if (humidity) {
            if (humidity.target !== undefined) updateData.humidityTarget = humidity.target;
            if (humidity.current !== undefined) updateData.humidityCurrent = humidity.current;
        }

        // Handle lighting updates
        if (lighting) {
            if (lighting.isOn !== undefined) updateData.lightingIsOn = lighting.isOn;
            if (lighting.brightness !== undefined) updateData.lightingBrightness = lighting.brightness;
            if (lighting.color !== undefined) updateData.lightingColor = lighting.color;
        }

        await room.update(updateData);

        const updatedRoom = await Room.findByPk(room.id, {
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

        res.json({
            success: true,
            message: 'Room updated successfully',
            data: { room: updatedRoom }
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
        const room = await Room.findOne({
            where: {
                id: req.params.id,
                ownerId: req.user.id,
                isActive: true
            }
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        await room.update({ isActive: false });

        // Also deactivate all devices in the room
        await Device.update(
            { isActive: false },
            { where: { roomId: req.params.id } }
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
            where: {
                id: req.params.id,
                ownerId: req.user.id,
                isActive: true
            }
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        const devices = await Device.findAll({
            where: {
                roomId: room.id,
                isActive: true
            },
            attributes: ['type', 'statusIsOnline', 'statusIsOn', 'powerConsumptionCurrent']
        });

        const stats = {
            totalDevices: devices.length,
            onlineDevices: devices.filter(d => d.statusIsOnline).length,
            activeDevices: devices.filter(d => d.statusIsOn).length,
            totalPowerConsumption: devices.reduce((sum, d) => sum + (parseFloat(d.powerConsumptionCurrent) || 0), 0)
        };

        // Count devices by type
        const deviceTypeCount = devices.reduce((acc, device) => {
            acc[device.type] = (acc[device.type] || 0) + 1;
            return acc;
        }, {});

        res.json({
            success: true,
            data: {
                room: {
                    id: room.id,
                    name: room.name,
                    isOccupied: room.isOccupied
                },
                stats: {
                    ...stats,
                    deviceTypeCount
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