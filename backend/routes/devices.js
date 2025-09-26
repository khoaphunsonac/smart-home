const express = require('express');
const Device = require('../models/Device');
const Room = require('../models/Room');
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
        const filter = {
            owner: req.user._id,
            isActive: true
        };

        if (type) filter.type = type;
        if (room) filter.room = room;

        const devices = await Device.find(filter)
            .populate('room', 'name isOccupied')
            .populate('owner', 'name username')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Device.countDocuments(filter);

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

// @desc    Get devices by room
// @route   GET /api/devices/room/:roomId
// @access  Private
router.get('/room/:roomId', validateId, async (req, res) => {
    try {
        // Verify room ownership
        const room = await Room.findOne({
            _id: req.params.roomId,
            owner: req.user._id,
            isActive: true
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        const devices = await Device.find({
            room: req.params.roomId,
            isActive: true
        })
            .populate('room', 'name')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: { devices }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get room devices',
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
            _id: req.params.id,
            owner: req.user._id,
            isActive: true
        })
            .populate('room', 'name isOccupied')
            .populate('owner', 'name username');

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
        const { name, type, brand, model, room, properties } = req.body;

        // Verify room ownership
        const roomDoc = await Room.findOne({
            _id: room,
            owner: req.user._id,
            isActive: true
        });

        if (!roomDoc) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        const device = new Device({
            name,
            type,
            brand,
            model,
            room,
            owner: req.user._id,
            ...(properties && { properties })
        });

        await device.save();

        // Add device to room's devices array
        roomDoc.devices.push(device._id);
        await roomDoc.save();

        const populatedDevice = await Device.findById(device._id)
            .populate('room', 'name')
            .populate('owner', 'name username');

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

// @desc    Update device
// @route   PUT /api/devices/:id
// @access  Private
router.put('/:id', validateId, async (req, res) => {
    try {
        const { name, brand, model, properties, status } = req.body;

        const device = await Device.findOneAndUpdate(
            {
                _id: req.params.id,
                owner: req.user._id,
                isActive: true
            },
            {
                ...(name && { name }),
                ...(brand !== undefined && { brand }),
                ...(model !== undefined && { model }),
                ...(properties && { properties: { ...device.properties, ...properties } }),
                ...(status && { status: { ...device.status, ...status } })
            },
            { new: true, runValidators: true }
        )
            .populate('room', 'name')
            .populate('owner', 'name username');

        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Device not found'
            });
        }

        res.json({
            success: true,
            message: 'Device updated successfully',
            data: { device }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update device',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Toggle device status
// @route   PUT /api/devices/:id/toggle
// @access  Private
router.put('/:id/toggle', validateId, async (req, res) => {
    try {
        const device = await Device.findOne({
            _id: req.params.id,
            owner: req.user._id,
            isActive: true
        });

        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Device not found'
            });
        }

        if (!device.status.isOnline) {
            return res.status(400).json({
                success: false,
                message: 'Device is offline'
            });
        }

        device.status.isOn = !device.status.isOn;
        device.status.lastSeen = new Date();
        await device.save();

        const populatedDevice = await Device.findById(device._id)
            .populate('room', 'name');

        res.json({
            success: true,
            message: `Device ${device.status.isOn ? 'turned on' : 'turned off'} successfully`,
            data: { device: populatedDevice }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to toggle device',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Delete device (soft delete)
// @route   DELETE /api/devices/:id
// @access  Private
router.delete('/:id', validateId, async (req, res) => {
    try {
        const device = await Device.findOneAndUpdate(
            {
                _id: req.params.id,
                owner: req.user._id,
                isActive: true
            },
            { isActive: false },
            { new: true }
        );

        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Device not found'
            });
        }

        // Remove device from room's devices array
        await Room.findByIdAndUpdate(
            device.room,
            { $pull: { devices: device._id } }
        );

        res.json({
            success: true,
            message: 'Device deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete device',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Add device schedule
// @route   POST /api/devices/:id/schedule
// @access  Private
router.post('/:id/schedule', validateId, async (req, res) => {
    try {
        const { name, time, days, action, value } = req.body;

        if (!name || !time || !days || !action) {
            return res.status(400).json({
                success: false,
                message: 'Name, time, days, and action are required'
            });
        }

        const device = await Device.findOne({
            _id: req.params.id,
            owner: req.user._id,
            isActive: true
        });

        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Device not found'
            });
        }

        const newSchedule = {
            name,
            time,
            days,
            action,
            ...(value !== undefined && { value })
        };

        device.schedule.push(newSchedule);
        await device.save();

        res.status(201).json({
            success: true,
            message: 'Schedule added successfully',
            data: { schedule: newSchedule }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to add schedule',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Get device statistics
// @route   GET /api/devices/stats
// @access  Private
router.get('/stats', async (req, res) => {
    try {
        const stats = await Device.aggregate([
            { $match: { owner: req.user._id, isActive: true } },
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
                    devicesByType: {
                        $push: '$type'
                    }
                }
            }
        ]);

        const result = stats[0] || {
            totalDevices: 0,
            onlineDevices: 0,
            activeDevices: 0,
            totalPowerConsumption: 0,
            devicesByType: []
        };

        // Count devices by type
        const deviceTypeCount = result.devicesByType.reduce((acc, type) => {
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});

        res.json({
            success: true,
            data: {
                ...result,
                deviceTypeCount,
                devicesByType: undefined // Remove the array
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get device statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;