const express = require('express');
const { User, Room } = require('../models');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { validateId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: [{
                model: Room,
                as: 'rooms',
                attributes: ['id', 'name', 'isOccupied', 'createdAt']
            }]
        });

        res.json({
            success: true,
            data: { user }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get user profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', async (req, res) => {
    try {
        const { name, birthday, avatar } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (birthday) updateData.birthday = birthday;
        if (avatar) updateData.avatar = avatar;

        await req.user.update(updateData);
        const updatedUser = await User.findByPk(req.user.id);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: { user: updatedUser }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
router.put('/change-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }

        const user = await User.findByPk(req.user.id);

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        await user.update({ password: newPassword });

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
router.get('/', authorizeRole('admin'), validatePagination, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const users = await User.find()
            .select('-password')
            .populate('createdRooms', 'name isOccupied')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments();

        res.json({
            success: true,
            data: {
                users,
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
            message: 'Failed to get users',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Get user by ID (Admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
router.get('/:id', authorizeRole('admin'), validateId, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('createdRooms', 'name isOccupied createdAt');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: { user }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Update user status (Admin only)
// @route   PUT /api/users/:id/status
// @access  Private/Admin
router.put('/:id/status', authorizeRole('admin'), validateId, async (req, res) => {
    try {
        const { isActive } = req.body;

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'isActive must be a boolean value'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: { user }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update user status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;