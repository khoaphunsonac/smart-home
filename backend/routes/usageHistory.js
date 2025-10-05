const express = require('express');
const { UsageHistory, Room, User, sequelize } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { validatePagination, validateId } = require('../middleware/validation');
const { Op } = require('sequelize');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// @desc    Get usage history for current user
// @route   GET /api/usage-history
// @access  Private
router.get('/', validatePagination, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { room_id, device_type } = req.query;

        // Build filter
        const whereClause = { user_id: req.user.id };
        if (room_id) whereClause.room_id = room_id;
        if (device_type) whereClause.deviceType = device_type;

        const usageHistory = await UsageHistory.findAll({
            where: whereClause,
            include: [
                {
                    model: Room,
                    as: 'room',
                    attributes: ['id', 'name']
                }
            ],
            order: [['usageDate', 'DESC']],
            offset: skip,
            limit: limit
        });

        const total = await UsageHistory.count({
            where: whereClause
        });

        const pagination = {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total,
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
        };

        res.json({
            success: true,
            data: {
                usageHistory,
                pagination
            }
        });

    } catch (error) {
        console.error('Usage History API Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to get usage history',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Get usage statistics for current user
// @route   GET /api/usage-history/stats
// @access  Private
router.get('/stats', async (req, res) => {
    try {
        const { period = '7d' } = req.query;

        let dateFilter = new Date();
        switch (period) {
            case '24h':
                dateFilter.setDate(dateFilter.getDate() - 1);
                break;
            case '7d':
                dateFilter.setDate(dateFilter.getDate() - 7);
                break;
            case '30d':
                dateFilter.setDate(dateFilter.getDate() - 30);
                break;
            default:
                dateFilter.setDate(dateFilter.getDate() - 7);
        }

        const stats = await UsageHistory.findAll({
            where: {
                user_id: req.user.id,
                usageDate: {
                    [Op.gte]: dateFilter
                }
            },
            attributes: [
                'deviceType',
                [sequelize.fn('SUM', sequelize.col('duration')), 'totalDuration'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalSessions']
            ],
            group: ['deviceType']
        });

        res.json({
            success: true,
            data: { stats }
        });

    } catch (error) {
        console.error('Usage Stats Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to get usage statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Create new usage history entry
// @route   POST /api/usage-history
// @access  Private
router.post('/', async (req, res) => {
    try {
        const { room_id, deviceType, duration, energyConsumed } = req.body;

        if (!room_id || !deviceType || !duration) {
            return res.status(400).json({
                success: false,
                message: 'Room ID, device type, and duration are required'
            });
        }

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

        const usageHistory = await UsageHistory.create({
            room_id,
            user_id: req.user.id,
            deviceType,
            duration,
            energyConsumed: energyConsumed || 0,
            usageDate: new Date()
        });

        res.status(201).json({
            success: true,
            message: 'Usage history created successfully',
            data: { usageHistory }
        });

    } catch (error) {
        console.error('Create usage history error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to create usage history',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;