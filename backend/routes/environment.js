const express = require("express");
const { EnvironmentData, Room, User, Notification } = require("../models");
const { authenticateToken } = require("../middleware/auth");
const { validatePagination, validateRoomId } = require("../middleware/validation");
const AdafruitService = require("../utils/adafruit");

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// @desc    Get environment data for a room
// @route   GET /api/environment/:roomId
// @access  Private
router.get("/:roomId", validateRoomId, async (req, res) => {
    try {
        const { roomId } = req.params;
        const limit = parseInt(req.query.limit) || 10;

        // Check if room belongs to user
        const room = await Room.findOne({
            where: {
                id: roomId,
                user_id: req.user.id,
            },
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found",
            });
        }

        const environmentData = await EnvironmentData.findAll({
            where: { room_id: roomId },
            order: [["timestamp", "DESC"]],
            limit: limit,
        });

        res.json({
            success: true,
            data: { environmentData },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get environment data",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
});

// @desc    Get latest environment data for a room
// @route   GET /api/environment/:roomId/latest
// @access  Private
router.get("/:roomId/latest", validateRoomId, async (req, res) => {
    try {
        const { roomId } = req.params;

        // Check if room belongs to user
        const room = await Room.findOne({
            where: {
                id: roomId,
                user_id: req.user.id,
            },
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found",
            });
        }

        const latestData = await EnvironmentData.findOne({
            where: { room_id: roomId },
            order: [["timestamp", "DESC"]],
        });

        res.json({
            success: true,
            data: { environmentData: latestData },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get latest environment data",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
});

// @desc    Create new environment data
// @route   POST /api/environment/:roomId
// @access  Private
router.post("/:roomId", validateRoomId, async (req, res) => {
    try {
        const { roomId } = req.params;
        const { temperature, humidity, lightLevel } = req.body;

        // Check if room belongs to user
        const room = await Room.findOne({
            where: {
                id: roomId,
                user_id: req.user.id,
            },
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found",
            });
        }

        const environmentData = await EnvironmentData.create({
            temperature,
            humidity,
            lightLevel,
            room_id: roomId,
            timestamp: new Date(),
        });

        // Kiểm tra ngưỡng an toàn và tạo notification nếu vượt ngưỡng
        const notifications = [];

        // Nhiệt độ > 28°C
        if (temperature !== null && temperature !== undefined && temperature > 28) {
            try {
                const notification = await Notification.create({
                    message: `Nhiệt độ trong ${room.name} cao bất thường: ${temperature.toFixed(1)}°C (ngưỡng an toàn: ≤ 28°C)`,
                    user_id: req.user.id,
                    timestamp: new Date(),
                    isRead: false
                });
                notifications.push({ type: 'temperature', value: temperature, notification });
            } catch (error) {
                console.error('Failed to create temperature notification:', error);
            }
        }

        // Độ ẩm < 50%
        if (humidity !== null && humidity !== undefined && humidity < 50) {
            try {
                const notification = await Notification.create({
                    message: `Độ ẩm trong ${room.name} thấp bất thường: ${humidity.toFixed(1)}% (ngưỡng an toàn: ≥ 50%)`,
                    user_id: req.user.id,
                    timestamp: new Date(),
                    isRead: false
                });
                notifications.push({ type: 'humidity', value: humidity, notification });
            } catch (error) {
                console.error('Failed to create humidity notification:', error);
            }
        }

        // Ánh sáng < 50 lux
        if (lightLevel !== null && lightLevel !== undefined && lightLevel < 50) {
            try {
                const notification = await Notification.create({
                    message: `Cường độ ánh sáng trong ${room.name} thấp bất thường: ${lightLevel.toFixed(0)} lux (ngưỡng an toàn: ≥ 50 lux)`,
                    user_id: req.user.id,
                    timestamp: new Date(),
                    isRead: false
                });
                notifications.push({ type: 'lightLevel', value: lightLevel, notification });
            } catch (error) {
                console.error('Failed to create light notification:', error);
            }
        }

        // Lấy user để lấy credentials từ user
        const user = await User.findByPk(req.user.id);

        // Only use user's own credentials
        if (!user?.adaUsername || !user?.adakey) {
            console.warn("User does not have Adafruit credentials, skipping sync");
        } else {
            const adafruit = new AdafruitService(user.adaUsername, user.adakey);

            // Gửi dữ liệu lên các feed tương ứng
            const adafruitData = {};
            if (temperature !== undefined && temperature !== null) {
                adafruitData.temperature = temperature;
            }
            if (humidity !== undefined && humidity !== null) {
                adafruitData.humidity = humidity;
            }
            if (lightLevel !== undefined && lightLevel !== null) {
                adafruitData.lightlevel = lightLevel;
            }

            if (Object.keys(adafruitData).length > 0) {
                // Gửi bất đồng bộ, không chờ kết quả để không làm chậm response
                adafruit.sendMultipleData(adafruitData).catch((err) => {
                    console.error("Failed to send data to Adafruit IO:", err);
                });
            }
        }

        res.status(201).json({
            success: true,
            message: "Environment data created successfully",
            data: { 
                environmentData,
                notificationsCreated: notifications.length > 0 ? notifications : undefined
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create environment data",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
});

// @desc    Generate mock environment data for testing (without hardware)
// @route   POST /api/environment/:roomId/mock
// @access  Private
router.post("/:roomId/mock", validateRoomId, async (req, res) => {
    try {
        const { roomId } = req.params;
        const { count = 20 } = req.body; // Number of mock records to create

        // Check if room belongs to user
        const room = await Room.findOne({
            where: {
                id: roomId,
                user_id: req.user.id,
            },
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found",
            });
        }

        // Generate mock data with realistic values
        const mockDataArray = [];
        const now = new Date();

        for (let i = 0; i < count; i++) {
            // Generate timestamps going backwards (newest first)
            const timestamp = new Date(now.getTime() - i * 10000); // 10 seconds apart

            // Generate realistic values with some variation
            const temperature = 25 + Math.sin(i / 3) * 3 + (Math.random() - 0.5) * 2; // 22-28°C
            const humidity = 60 + Math.sin(i / 4) * 10 + (Math.random() - 0.5) * 5; // 50-70%
            const lightLevel = 50 + Math.sin(i / 2) * 30 + (Math.random() - 0.5) * 10; // 20-80 lux

            mockDataArray.push({
                temperature: parseFloat(temperature.toFixed(1)),
                humidity: parseFloat(humidity.toFixed(1)),
                lightLevel: parseFloat(lightLevel.toFixed(0)),
                room_id: roomId,
                timestamp: timestamp,
            });
        }

        // Bulk insert mock data
        const createdData = await EnvironmentData.bulkCreate(mockDataArray);

        res.status(201).json({
            success: true,
            message: `Successfully generated ${count} mock environment data records`,
            data: {
                count: createdData.length,
                latest: createdData[0],
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to generate mock data",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
});

module.exports = router;
