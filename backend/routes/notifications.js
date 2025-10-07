const express = require('express');
const { Notification, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { validatePagination, validateId } = require('../middleware/validation');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// @desc    Get all notifications for current user
// @route   GET /api/notifications
// @access  Private
router.get('/', validatePagination, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const notifications = await Notification.findAll({
            where: { user_id: req.user.id },
            order: [['createdAt', 'DESC']],
            offset: skip,
            limit: limit
        });

        const total = await Notification.count({
            where: { user_id: req.user.id }
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
                notifications,
                pagination
            }
        });

    } catch (error) {
        console.error('Notifications API Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to get notifications',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', validateId, async (req, res) => {
    try {
        const notification = await Notification.findOne({
            where: {
                id: req.params.id,
                user_id: req.user.id
            }
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        await notification.update({ isRead: true });

        res.json({
            success: true,
            message: 'Notification marked as read',
            data: { notification }
        });

    } catch (error) {
        console.error('Mark notification read error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Create new notification
// @route   POST /api/notifications
// @access  Private
router.post('/', async (req, res) => {
    try {
        const { title, message, type } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Title and message are required'
            });
        }

        const notification = await Notification.create({
            title,
            message,
            type: type || 'info',
            user_id: req.user.id,
            isRead: false
        });

        res.status(201).json({
            success: true,
            message: 'Notification created successfully',
            data: { notification }
        });

    } catch (error) {
        console.error('Create notification error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to create notification',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;