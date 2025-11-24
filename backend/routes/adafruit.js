const express = require("express");
const { EnvironmentData, Room, Device, User } = require("../models");
const { authenticateToken } = require("../middleware/auth");
const { validateRoomId } = require("../middleware/validation");
const AdafruitService = require("../utils/adafruit");

const router = express.Router();

// Default Adafruit IO credentials
const DEFAULT_ADA_USERNAME = "Tusla";
const DEFAULT_ADA_KEY = "aio_kciA19Izj8kkk1lIKvZ6Mm0yvDu1";

// Apply authentication to all routes
router.use(authenticateToken);

// @desc    Verify Adafruit IO credentials và lấy thông tin user (chỉ cần API key)
// @route   POST /api/adafruit/verify
// @access  Private
router.post("/verify", async (req, res) => {
    try {
        const { adakey, adaUsername } = req.body;

        if (!adakey) {
            return res.status(400).json({
                success: false,
                message: "adakey is required",
            });
        }

        // Nếu có username, thử verify với username
        // Nếu không có hoặc sai, lấy từ API key
        let adafruit;
        let verifyResult;

        if (adaUsername) {
            adafruit = new AdafruitService(adaUsername, adakey);
            verifyResult = await adafruit.verifyCredentials();

            // Nếu có actualUsername trong response, nghĩa là username ban đầu sai
            if (verifyResult.success && verifyResult.actualUsername) {
                return res.json({
                    success: true,
                    message: "Credentials are valid, but username was incorrect",
                    data: {
                        username: verifyResult.actualUsername,
                        name: verifyResult.data.name,
                        id: verifyResult.data.id,
                        created_at: verifyResult.data.created_at,
                        note: `The username you provided ("${adaUsername}") was incorrect. The actual username is "${verifyResult.actualUsername}"`,
                    },
                });
            }
        }

        // Nếu không có username hoặc verify với username thất bại, thử lấy từ API key
        if (!verifyResult || !verifyResult.success) {
            // Tạo service với username tạm (sẽ không dùng)
            adafruit = new AdafruitService("temp", adakey);
            const userInfoResult = await adafruit.getUserInfo();

            if (!userInfoResult.success) {
                // Cải thiện error message với thông tin chi tiết hơn
                const errorData = userInfoResult.error;
                let errorMessage = "The API key is incorrect or invalid";
                let suggestion = "Please check your API key on https://io.adafruit.com/ → Settings → View AIO Key";

                if (errorData) {
                    const errorStr = typeof errorData === "string" ? errorData : JSON.stringify(errorData);
                    if (errorStr.includes("401") || errorStr.includes("Unauthorized")) {
                        errorMessage = "API key is invalid or expired";
                        suggestion =
                            "Please get a new Active Key from https://io.adafruit.com/ → Settings → View AIO Key";
                    } else if (errorStr.includes("403") || errorStr.includes("Forbidden")) {
                        errorMessage = "API key does not have permission";
                        suggestion = "Please check your Adafruit IO account permissions";
                    }
                }

                return res.status(400).json({
                    success: false,
                    message: "Invalid Adafruit IO API key",
                    error: {
                        message: errorMessage,
                        suggestion: suggestion,
                        details: process.env.NODE_ENV === "development" ? errorData : undefined,
                    },
                });
            }

            // Trả về username thực tế từ API key
            const userInfo = userInfoResult.data;
            return res.json({
                success: true,
                message: "Credentials are valid",
                data: {
                    username: userInfo.username,
                    name: userInfo.name,
                    id: userInfo.id,
                    created_at: userInfo.created_at,
                    note: adaUsername
                        ? `The username you provided ("${adaUsername}") was incorrect. Use "${userInfo.username}" instead.`
                        : `Your Adafruit IO username is "${userInfo.username}"`,
                },
            });
        }

        // Nếu verify thành công với username ban đầu
        const userInfo = verifyResult.data;
        res.json({
            success: true,
            message: "Credentials are valid",
            data: {
                username: userInfo.username,
                name: userInfo.name,
                id: userInfo.id,
                created_at: userInfo.created_at,
            },
        });
    } catch (error) {
        console.error("Error verifying Adafruit credentials:", error);
        res.status(500).json({
            success: false,
            message: "Failed to verify Adafruit IO credentials",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
});

// @desc    Gửi dữ liệu trực tiếp lên Adafruit IO
// @route   POST /api/adafruit/:roomId/send
// @access  Private
// Lưu ý: Route này phải đặt TRƯỚC route /:roomId/feeds/:feedKey để tránh conflict
router.post("/:roomId/send", validateRoomId, async (req, res) => {
    try {
        const { roomId } = req.params;
        const { feedKey, value } = req.body;

        if (!feedKey || value === undefined) {
            return res.status(400).json({
                success: false,
                message: "feedKey and value are required",
            });
        }

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

        // Lấy user để lấy credentials từ user
        const user = await User.findByPk(req.user.id);

        // Chỉ dùng User credentials hoặc Default
        const adaUsername = user?.adaUsername || DEFAULT_ADA_USERNAME;
        const adakey = user?.adakey || DEFAULT_ADA_KEY;

        const adafruit = new AdafruitService(adaUsername, adakey);
        const result = await adafruit.sendData(feedKey, value);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: "Failed to send data to Adafruit IO",
                error: result.error,
            });
        }

        res.json({
            success: true,
            message: "Data sent to Adafruit IO successfully",
            data: result.data,
        });
    } catch (error) {
        console.error("Error sending data to Adafruit IO:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send data to Adafruit IO",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
});

// @desc    Sync environment data từ DB lên Adafruit IO
// @route   POST /api/adafruit/sync/:roomId
// @access  Private
router.post("/sync/:roomId", validateRoomId, async (req, res) => {
    try {
        const { roomId } = req.params;
        const { limit = 10 } = req.query;

        // Kiểm tra room và credentials
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

        // Lấy user để kiểm tra credentials
        const user = await User.findByPk(req.user.id);

        // Kiểm tra credentials (User hoặc Default)
        const hasCredentials = user?.adaUsername || DEFAULT_ADA_USERNAME;
        const hasKey = user?.adakey || DEFAULT_ADA_KEY;

        if (!hasCredentials || !hasKey) {
            return res.status(400).json({
                success: false,
                message: "Adafruit credentials not configured. Please set adaUsername and adakey in user profile.",
            });
        }

        // Lấy dữ liệu mới nhất từ DB
        const latestData = await EnvironmentData.findOne({
            where: { room_id: roomId },
            order: [["timestamp", "DESC"]],
        });

        if (!latestData) {
            return res.status(404).json({
                success: false,
                message: "No environment data found for this room",
            });
        }

        // Chỉ dùng User credentials hoặc Default
        const adaUsername = user?.adaUsername || DEFAULT_ADA_USERNAME;
        const adakey = user?.adakey || DEFAULT_ADA_KEY;

        // Gửi lên Adafruit IO
        const adafruit = new AdafruitService(adaUsername, adakey);
        const adafruitData = {};

        if (latestData.temperature !== null && latestData.temperature !== undefined) {
            adafruitData.temperature = latestData.temperature;
        }
        if (latestData.humidity !== null && latestData.humidity !== undefined) {
            adafruitData.humidity = latestData.humidity;
        }
        if (latestData.lightLevel !== null && latestData.lightLevel !== undefined) {
            adafruitData.lightlevel = latestData.lightLevel;
        }

        if (Object.keys(adafruitData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid data to sync",
            });
        }

        const results = await adafruit.sendMultipleData(adafruitData);

        // Kiểm tra kết quả
        const hasError = results.some((result) => !result.success);
        if (hasError) {
            return res.status(500).json({
                success: false,
                message: "Some data failed to sync to Adafruit IO",
                data: {
                    syncedData: latestData,
                    adafruitResults: results,
                },
            });
        }

        res.json({
            success: true,
            message: "Data synced to Adafruit IO successfully",
            data: {
                syncedData: latestData,
                adafruitResults: results,
            },
        });
    } catch (error) {
        console.error("Error syncing data to Adafruit IO:", error);
        res.status(500).json({
            success: false,
            message: "Failed to sync data to Adafruit IO",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
});

// @desc    Đồng bộ feeds từ Adafruit IO vào database (xóa devices cũ và tạo mới từ feeds)
// @route   POST /api/adafruit/:roomId/sync-devices
// @access  Private
router.post("/:roomId/sync-devices", validateRoomId, async (req, res) => {
    try {
        const { roomId } = req.params;

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

        // Lấy user để lấy credentials từ user
        const user = await require("../models").User.findByPk(req.user.id);

        // Chỉ dùng User credentials hoặc Default
        let adaUsername = user?.adaUsername || DEFAULT_ADA_USERNAME;
        const adakey = user?.adakey || DEFAULT_ADA_KEY;

        let adafruit = new AdafruitService(adaUsername, adakey);

        // Verify credentials trước khi lấy feeds
        let verifyResult = await adafruit.verifyCredentials();

        if (!verifyResult.success) {
            console.log("Initial verify failed, trying to get user info...");
            // Thử getUserInfo để lấy username thực tế từ API key
            const userInfoResult = await adafruit.getUserInfo();

            if (userInfoResult.success && userInfoResult.data.username) {
                const actualUsername = userInfoResult.data.username;
                console.log(`Found actual username from API key: ${actualUsername}`);
                // Cập nhật username thực tế vào User
                await User.update({ adaUsername: actualUsername }, { where: { id: req.user.id } });
                adaUsername = actualUsername;
                adafruit = new AdafruitService(actualUsername, adakey);
                // Retry verify với username đúng
                verifyResult = await adafruit.verifyCredentials();
                if (!verifyResult.success) {
                    console.error("Verify still failed after updating username");
                    console.error("Verify error:", JSON.stringify(verifyResult.error, null, 2));
                    return res.status(400).json({
                        success: false,
                        message: "Adafruit IO credentials are invalid",
                        error: {
                            message: `API key is incorrect or invalid`,
                            suggestion:
                                "Please verify your API key on https://io.adafruit.com/ → Settings → View AIO Key",
                        },
                    });
                }
            } else {
                // Không thể lấy username từ API key, thử lấy feeds trực tiếp để xác minh
                console.log("Could not get user info, trying to get feeds directly...");
                const feedsResult = await adafruit.getAllFeeds();

                if (feedsResult.success && Array.isArray(feedsResult.data) && feedsResult.data.length > 0) {
                    // Nếu lấy feeds thành công, lấy username từ owner của feed đầu tiên
                    const firstFeed = feedsResult.data[0];
                    if (firstFeed.owner && firstFeed.owner.username) {
                        const actualUsername = firstFeed.owner.username;
                        console.log(`Found username from feed owner: ${actualUsername}`);
                        await User.update({ adaUsername: actualUsername }, { where: { id: req.user.id } });
                        adaUsername = actualUsername;
                        adafruit = new AdafruitService(actualUsername, adakey);
                        // Verify lại với username đúng
                        verifyResult = await adafruit.verifyCredentials();
                        if (!verifyResult.success) {
                            console.error("Verify failed even after getting username from feeds");
                            return res.status(400).json({
                                success: false,
                                message: "Adafruit IO credentials are invalid",
                                error: {
                                    message: `API key is incorrect or invalid`,
                                    suggestion:
                                        "Please verify your API key on https://io.adafruit.com/ → Settings → View AIO Key",
                                },
                            });
                        }
                    } else {
                        // Có feeds nhưng không có owner info, có thể username đúng nhưng cần verify lại
                        console.log("Got feeds but no owner info, credentials might be correct");
                        // Tiếp tục với username hiện tại
                    }
                } else {
                    // Không thể lấy feeds, có thể username hoặc API key sai
                    const errorMsg = verifyResult.error?.error || verifyResult.error;
                    const errorStr = typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg);

                    console.error("Failed to verify credentials:", errorStr);
                    console.error("getUserInfo result:", userInfoResult);
                    console.error("getAllFeeds result:", feedsResult);

                    if (errorStr && (errorStr.includes("not found") || errorStr.includes("does not exist"))) {
                        return res.status(400).json({
                            success: false,
                            message: "Adafruit IO credentials are invalid",
                            error: {
                                message: `Username "${adaUsername}" does not exist. Please check your username (case-sensitive).`,
                                suggestion: "Please verify your credentials using POST /api/adafruit/verify",
                            },
                        });
                    }
                    return res.status(400).json({
                        success: false,
                        message: "Adafruit IO credentials are invalid",
                        error: {
                            message: "API key is incorrect or username does not exist",
                            suggestion: "Please verify your credentials using POST /api/adafruit/verify",
                        },
                    });
                }
            }
        } else if (verifyResult.actualUsername) {
            // Username ban đầu sai, nhưng đã tìm được username đúng
            const actualUsername = verifyResult.actualUsername;
            console.log(`Updating username from "${adaUsername}" to "${actualUsername}"`);
            await User.update({ adaUsername: actualUsername }, { where: { id: req.user.id } });
            adaUsername = actualUsername;
            adafruit = new AdafruitService(actualUsername, adakey);
        }

        // Lấy danh sách feeds từ Adafruit IO
        const feedsResult = await adafruit.getAllFeeds();

        if (!feedsResult.success) {
            return res.status(500).json({
                success: false,
                message: "Failed to get feeds from Adafruit IO",
                error: feedsResult.error,
            });
        }

        const feeds = Array.isArray(feedsResult.data) ? feedsResult.data : [];

        if (feeds.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No feeds found on Adafruit IO",
            });
        }

        // Xóa tất cả devices cũ của room
        const deletedCount = await Device.destroy({
            where: { room_id: roomId },
        });

        // Tạo devices mới từ feeds
        const createdDevices = [];
        const errors = [];

        for (const feed of feeds) {
            try {
                // Map feed thành device
                // feed.name -> device.name
                // feed.key -> có thể dùng để identify
                // feed.status -> map thành isOn (online = true, offline = false)
                // feed.type hoặc tạo type mặc định
                const deviceName = feed.name || feed.key || "Unknown Device";
                const deviceType = feed.unit_type || "Sensor"; // Hoặc có thể map từ feed.name
                const isOn = feed.status === "online";

                const device = await Device.create({
                    name: deviceName,
                    type: deviceType,
                    room_id: roomId,
                    isOn: isOn,
                });

                createdDevices.push({
                    id: device.id,
                    name: device.name,
                    type: device.type,
                    isOn: device.isOn,
                    feedKey: feed.key,
                    feedName: feed.name,
                });
            } catch (error) {
                errors.push({
                    feedKey: feed.key,
                    feedName: feed.name,
                    error: error.message,
                });
            }
        }

        res.json({
            success: true,
            message: "Devices synced successfully",
            data: {
                deletedDevices: deletedCount,
                createdDevices: createdDevices.length,
                totalFeeds: feeds.length,
                devices: createdDevices,
                errors: errors.length > 0 ? errors : undefined,
            },
        });
    } catch (error) {
        console.error("Error syncing devices from Adafruit IO:", error);
        res.status(500).json({
            success: false,
            message: "Failed to sync devices from Adafruit IO",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
});

// @desc    Lấy danh sách tất cả feeds (thiết bị) từ Adafruit IO
// @route   GET /api/adafruit/:roomId/feeds
// @access  Private
router.get("/:roomId/feeds", validateRoomId, async (req, res) => {
    try {
        const { roomId } = req.params;

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

        // Lấy user để lấy credentials từ user (ưu tiên cao nhất)
        const user = await User.findByPk(req.user.id);

        // Ưu tiên: User credentials > Room credentials > Default
        let adaUsername = user?.adaUsername || room.adaUsername || DEFAULT_ADA_USERNAME;
        const adakey = user?.adakey || room.adakey || DEFAULT_ADA_KEY;

        let adafruit = new AdafruitService(adaUsername, adakey);

        // Verify credentials trước khi lấy feeds
        // Nếu username sai, thử lấy username thực tế từ API key
        let verifyResult = await adafruit.verifyCredentials();

        if (!verifyResult.success) {
            // Nếu verify với username thất bại, thử lấy user info từ API key
            const userInfoResult = await adafruit.getUserInfo();

            if (userInfoResult.success) {
                // Username sai, nhưng API key đúng
                // Cập nhật username thực tế vào User (ưu tiên) hoặc Room
                const actualUsername = userInfoResult.data.username;
                if (!user?.adaUsername) {
                    // Nếu user chưa có credentials, cập nhật vào User
                    await User.update({ adaUsername: actualUsername }, { where: { id: req.user.id } });
                } else {
                    // Nếu user đã có, cập nhật vào Room
                    await Room.update({ adaUsername: actualUsername }, { where: { id: roomId, user_id: req.user.id } });
                }

                // Tạo lại service với username đúng
                adaUsername = actualUsername;
                adafruit = new AdafruitService(actualUsername, adakey);
                verifyResult = { success: true, data: userInfoResult.data };
            } else {
                // Cả username và API key đều sai
                const errorMsg = verifyResult.error?.error || verifyResult.error;
                const errorStr = typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg);
                if (errorStr && (errorStr.includes("not found") || errorStr.includes("does not exist"))) {
                    return res.status(400).json({
                        success: false,
                        message: "Adafruit IO credentials are invalid",
                        error: {
                            message: `Username "${adaUsername}" does not exist or API key is incorrect`,
                            suggestion: "Please verify your credentials using POST /api/adafruit/verify",
                        },
                    });
                }
                return res.status(500).json({
                    success: false,
                    message: "Failed to verify Adafruit IO credentials",
                    error: verifyResult.error,
                });
            }
        } else if (verifyResult.actualUsername) {
            // Username ban đầu sai, nhưng đã tìm được username đúng
            // Cập nhật username thực tế vào User (ưu tiên) hoặc Room
            const actualUsername = verifyResult.actualUsername;
            if (!user?.adaUsername) {
                // Nếu user chưa có credentials, cập nhật vào User
                await User.update({ adaUsername: actualUsername }, { where: { id: req.user.id } });
            } else {
                // Nếu user đã có, cập nhật vào Room
                await Room.update({ adaUsername: actualUsername }, { where: { id: roomId, user_id: req.user.id } });
            }

            // Tạo lại service với username đúng
            adaUsername = actualUsername;
            adafruit = new AdafruitService(actualUsername, adakey);
        }

        const result = await adafruit.getAllFeeds();

        if (!result.success) {
            // Kiểm tra lại lỗi cụ thể
            const errorMsg = result.error?.error || result.error;
            const errorStr = typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg);
            if (errorStr && (errorStr.includes("not found") || errorStr.includes("does not exist"))) {
                return res.status(400).json({
                    success: false,
                    message: "Adafruit IO credentials are invalid",
                    error: {
                        message: `Username "${adaUsername}" does not exist or API key is incorrect`,
                        suggestion: "Please check your Adafruit IO username and API key in your user profile",
                    },
                });
            }
            return res.status(500).json({
                success: false,
                message: "Failed to get feeds from Adafruit IO",
                error: result.error,
            });
        }

        res.json({
            success: true,
            message: "Feeds retrieved successfully",
            data: {
                feeds: result.data,
                count: Array.isArray(result.data) ? result.data.length : 0,
            },
        });
    } catch (error) {
        console.error("Error getting feeds from Adafruit IO:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get feeds from Adafruit IO",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
});

// @desc    Lấy thông tin chi tiết của một feed
// @route   GET /api/adafruit/:roomId/feeds/:feedKey/info
// @access  Private
router.get("/:roomId/feeds/:feedKey/info", validateRoomId, async (req, res) => {
    try {
        const { roomId, feedKey } = req.params;

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

        // Lấy user để lấy credentials từ user
        const user = await User.findByPk(req.user.id);

        // Chỉ dùng User credentials hoặc Default
        const adaUsername = user?.adaUsername || DEFAULT_ADA_USERNAME;
        const adakey = user?.adakey || DEFAULT_ADA_KEY;

        const adafruit = new AdafruitService(adaUsername, adakey);
        const result = await adafruit.getFeedInfo(feedKey);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: "Failed to get feed info from Adafruit IO",
                error: result.error,
            });
        }

        res.json({
            success: true,
            data: result.data,
        });
    } catch (error) {
        console.error("Error getting feed info from Adafruit IO:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get feed info from Adafruit IO",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
});

// @desc    Lấy dữ liệu từ Adafruit IO feed
// @route   GET /api/adafruit/:roomId/feeds/:feedKey
// @access  Private
router.get("/:roomId/feeds/:feedKey", validateRoomId, async (req, res) => {
    try {
        const { roomId, feedKey } = req.params;
        const { limit = 10 } = req.query;

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

        // Lấy user để lấy credentials từ user
        const user = await User.findByPk(req.user.id);

        // Chỉ dùng User credentials hoặc Default
        const adaUsername = user?.adaUsername || DEFAULT_ADA_USERNAME;
        const adakey = user?.adakey || DEFAULT_ADA_KEY;

        const adafruit = new AdafruitService(adaUsername, adakey);
        const result = await adafruit.getData(feedKey, parseInt(limit));

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: "Failed to get data from Adafruit IO",
                error: result.error,
            });
        }

        res.json({
            success: true,
            data: result.data,
        });
    } catch (error) {
        console.error("Error getting data from Adafruit IO:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get data from Adafruit IO",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
});

module.exports = router;
