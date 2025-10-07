const express = require('express');
const { EnvironmentData, Room } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { validatePagination, validateId } = require('../middleware/validation');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// @desc    Get environment data for a room
// @route   GET /api/environment/:roomId
// @access  Private
router.get('/:roomId', validateId, async (req, res) => {
    try {
        const { roomId } = req.params;
        const limit = parseInt(req.query.limit) || 10;

        // Check if room belongs to user
        const room = await Room.findOne({
            where: {
                id: roomId,
                user_id: req.user.id
            }
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        const environmentData = await EnvironmentData.findAll({
            where: { room_id: roomId },
            order: [['timestamp', 'DESC']],
            limit: limit
        });

        res.json({
            success: true,
            data: { environmentData }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get environment data',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Get latest environment data for a room
// @route   GET /api/environment/:roomId/latest
// @access  Private
router.get('/:roomId/latest', validateId, async (req, res) => {
    try {
        const { roomId } = req.params;

        // Check if room belongs to user
        const room = await Room.findOne({
            where: {
                id: roomId,
                user_id: req.user.id
            }
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        const latestData = await EnvironmentData.findOne({
            where: { room_id: roomId },
            order: [['timestamp', 'DESC']]
        });

        res.json({
            success: true,
            data: { environmentData: latestData }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get latest environment data',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Create new environment data
// @route   POST /api/environment/:roomId
// @access  Private
router.post('/:roomId', validateId, async (req, res) => {
    try {
        const { roomId } = req.params;
        const { temperature, humidity, lightLevel } = req.body;

        // Check if room belongs to user
        const room = await Room.findOne({
            where: {
                id: roomId,
                user_id: req.user.id
            }
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        const environmentData = await EnvironmentData.create({
            temperature,
            humidity,
            lightLevel,
            room_id: roomId,
            timestamp: new Date()
        });

        res.status(201).json({
            success: true,
            message: 'Environment data created successfully',
            data: { environmentData }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create environment data',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;