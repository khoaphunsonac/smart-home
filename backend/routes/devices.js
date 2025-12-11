const express = require('express');
const { Device, Room } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { validateDeviceCreation, validateId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// @desc    Get all devices for current user
// @route   GET /api/devices
// @access  Private
router.get('/', validatePagination, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { type, room } = req.query;

        // Build filter
        const whereClause = {};

        if (type) whereClause.type = type;
        if (room) whereClause.room_id = room;

        const devices = await Device.findAll({
            where: whereClause,
            include: [
                {
                    model: Room,
                    as: 'room',
                    attributes: ['id', 'name', 'isOccupied'],
                    where: { user_id: req.user.id }
                }
            ],
            offset: skip,
            limit: limit
        });

        const total = await Device.count({
            where: whereClause,
            include: [
                {
                    model: Room,
                    as: 'room',
                    where: { user_id: req.user.id }
                }
            ]
        });

        res.json({
            success: true,
            data: {
                devices,
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
            message: 'Failed to get devices',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Get device by ID
// @route   GET /api/devices/:id
// @access  Private
router.get('/:id', validateId, async (req, res) => {
    try {
        const device = await Device.findOne({
            where: { id: req.params.id },
            include: [
                {
                    model: Room,
                    as: 'room',
                    attributes: ['id', 'name', 'isOccupied'],
                    where: { user_id: req.user.id }
                }
            ]
        });

        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Device not found'
            });
        }

        res.json({
            success: true,
            data: { device }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get device',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Create new device
// @route   POST /api/devices
// @access  Private
router.post('/', validateDeviceCreation, async (req, res) => {
    try {
        const { name, type, room_id } = req.body;

        // Check if room belongs to user
        const room = await Room.findOne({
            where: {
                id: room_id,
                user_id: req.user.id
            }
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        const device = await Device.create({
            name,
            type,
            room_id,
            isOn: false
        });

        const populatedDevice = await Device.findByPk(device.id, {
            include: [
                {
                    model: Room,
                    as: 'room',
                    attributes: ['id', 'name', 'isOccupied']
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Device created successfully',
            data: { device: populatedDevice }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create device',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Toggle device on/off
// @route   PUT /api/devices/:id/toggle
// @access  Private
router.put('/:id/toggle', validateId, async (req, res) => {
    try {
        const device = await Device.findOne({
            where: { id: req.params.id },
            include: [
                {
                    model: Room,
                    as: 'room',
                    where: { user_id: req.user.id }
                }
            ]
        });

        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Device not found'
            });
        }

        await device.update({ isOn: !device.isOn });

        const updatedDevice = await Device.findByPk(device.id, {
            include: [
                {
                    model: Room,
                    as: 'room',
                    attributes: ['id', 'name', 'isOccupied']
                }
            ]
        });

        res.json({
            success: true,
            message: `Device ${updatedDevice.isOn ? 'turned on' : 'turned off'} successfully`,
            data: { device: updatedDevice }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to toggle device',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;