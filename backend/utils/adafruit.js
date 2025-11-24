const axios = require("axios");

class AdafruitService {
    constructor(username, apiKey) {
        this.username = username;
        this.apiKey = apiKey;
        this.baseURL = `https://io.adafruit.com/api/v2/${username}`;
    }

    /**
     * Xác thực credentials với Adafruit IO
     * Có thể không cần username nếu chỉ có API key
     * @returns {Promise}
     */
    async verifyCredentials() {
        try {
            // Thử lấy thông tin user để verify
            const response = await axios.get(`https://io.adafruit.com/api/v2/${this.username}`, {
                headers: {
                    "X-AIO-Key": this.apiKey,
                },
                timeout: 10000,
            });
            return { success: true, data: response.data };
        } catch (error) {
            // Nếu user endpoint fail, thử verify bằng cách lấy feeds
            console.log(`User endpoint failed, trying feeds endpoint as fallback...`);
            try {
                const feedsResponse = await axios.get(`${this.baseURL}/feeds`, {
                    headers: {
                        "X-AIO-Key": this.apiKey,
                    },
                    timeout: 10000,
                });

                // Nếu lấy feeds thành công, credentials hợp lệ
                console.log(`Feeds endpoint succeeded - credentials are valid`);

                // Lấy username từ owner của feed đầu tiên (nếu có)
                if (feedsResponse.data && Array.isArray(feedsResponse.data) && feedsResponse.data.length > 0) {
                    const firstFeed = feedsResponse.data[0];
                    const actualUsername = firstFeed.owner?.username || firstFeed.username || this.username;

                    return {
                        success: true,
                        data: {
                            username: actualUsername,
                            id: firstFeed.owner?.id,
                            verified_via: "feeds_endpoint",
                        },
                        actualUsername: actualUsername !== this.username ? actualUsername : undefined,
                    };
                } else {
                    // Không có feeds nhưng API call thành công
                    return {
                        success: true,
                        data: {
                            username: this.username,
                            verified_via: "feeds_endpoint_no_feeds",
                        },
                    };
                }
            } catch (feedsError) {
                // Cả user và feeds endpoint đều fail
                console.error("Both user and feeds endpoints failed");
                console.error("User endpoint error:", error.message);
                console.error("Feeds endpoint error:", feedsError.message);

                if (feedsError.response) {
                    console.error("Feeds error status:", feedsError.response.status);
                    console.error("Feeds error response:", JSON.stringify(feedsError.response.data, null, 2));
                }

                return {
                    success: false,
                    error: error.response?.data || error.message,
                };
            }
        }
    }

    /**
     * Lấy thông tin user từ API key (không cần username)
     * Thử nhiều endpoint để tìm user info
     * @returns {Promise}
     */
    async getUserInfo() {
        // Thử endpoint /me trước (nếu có)
        const endpoints = ["https://io.adafruit.com/api/v2/me", "https://io.adafruit.com/api/v2/"];

        for (const endpoint of endpoints) {
            try {
                const response = await axios.get(endpoint, {
                    headers: {
                        "X-AIO-Key": this.apiKey,
                    },
                    timeout: 10000,
                });

                // Kiểm tra xem response có chứa username không
                if (response.data && (response.data.username || response.data.id)) {
                    return { success: true, data: response.data };
                }
            } catch (error) {
                // Nếu không phải 404, có thể là lỗi khác (401, 403) - API key sai
                if (error.response && error.response.status !== 404) {
                    console.error(`Error getting user info from ${endpoint}:`, error.message);
                    if (error.response) {
                        console.error("Response error:", error.response.data);
                    }
                    return {
                        success: false,
                        error: error.response?.data || error.message,
                    };
                }
                // Nếu là 404, thử endpoint tiếp theo
                continue;
            }
        }

        // Nếu tất cả endpoint đều fail, thử lấy feeds để lấy username từ owner field
        // Vì feeds có thể chứa thông tin owner (username)
        try {
            console.log(`Trying to get feeds to extract username from owner field...`);
            const feedsResponse = await axios.get(`${this.baseURL}/feeds`, {
                headers: {
                    "X-AIO-Key": this.apiKey,
                },
                timeout: 10000,
            });

            // Nếu thành công, lấy username từ owner field của feed đầu tiên
            if (feedsResponse.data && Array.isArray(feedsResponse.data) && feedsResponse.data.length > 0) {
                const firstFeed = feedsResponse.data[0];
                if (firstFeed.owner && firstFeed.owner.username) {
                    const actualUsername = firstFeed.owner.username;
                    console.log(`Found username from feed owner: ${actualUsername}`);
                    return {
                        success: true,
                        data: {
                            username: actualUsername,
                            id: firstFeed.owner.id,
                        },
                    };
                } else if (firstFeed.username) {
                    // Nếu feed có username trực tiếp
                    const actualUsername = firstFeed.username;
                    console.log(`Found username from feed: ${actualUsername}`);
                    return {
                        success: true,
                        data: {
                            username: actualUsername,
                        },
                    };
                }
            } else {
                // Nếu không có feeds, có thể vẫn là credentials hợp lệ nhưng chưa có feeds
                console.log("No feeds found, but API call succeeded - credentials might be valid");
                return {
                    success: true,
                    data: {
                        username: this.username, // Sử dụng username hiện tại
                        note: "No feeds found but credentials appear valid",
                    },
                };
            }
        } catch (feedsError) {
            // Nếu lấy feeds cũng fail, có thể username hoặc API key sai
            console.error("Error getting feeds to extract username:", feedsError.message);
            if (feedsError.response) {
                console.error("Feeds error status:", feedsError.response.status);
                console.error("Feeds error response:", JSON.stringify(feedsError.response.data, null, 2));
            }
        }

        // Trả về lỗi không tìm thấy endpoint hợp lệ
        return {
            success: false,
            error: {
                error: "Cannot determine user info from API key alone. Adafruit IO requires username in the URL path.",
                suggestion: "Please provide the correct username along with the API key",
            },
        };
    }

    /**
     * Gửi dữ liệu lên Adafruit IO feed
     * @param {string} feedKey - Tên feed trên Adafruit IO (ví dụ: 'temperature', 'humidity')
     * @param {number|string} value - Giá trị cần gửi
     * @returns {Promise}
     */
    async sendData(feedKey, value) {
        try {
            const response = await axios.post(
                `${this.baseURL}/feeds/${feedKey}/data`,
                { value },
                {
                    headers: {
                        "X-AIO-Key": this.apiKey,
                        "Content-Type": "application/json",
                    },
                    timeout: 10000, // 10 seconds timeout
                }
            );
            return { success: true, data: response.data };
        } catch (error) {
            console.error(`Error sending data to Adafruit IO feed ${feedKey}:`, error.message);
            if (error.response) {
                console.error("Response error:", error.response.data);
            }
            return {
                success: false,
                error: error.response?.data || error.message,
            };
        }
    }

    /**
     * Gửi nhiều dữ liệu cùng lúc
     * @param {Object} data - Object chứa feedKey và value
     * @returns {Promise}
     */
    async sendMultipleData(data) {
        const promises = Object.entries(data).map(([feedKey, value]) => this.sendData(feedKey, value));
        return Promise.all(promises);
    }

    /**
     * Lấy dữ liệu từ Adafruit IO feed
     * @param {string} feedKey - Tên feed
     * @param {number} limit - Số lượng bản ghi muốn lấy
     * @returns {Promise}
     */
    async getData(feedKey, limit = 1) {
        try {
            const response = await axios.get(`${this.baseURL}/feeds/${feedKey}/data?limit=${limit}`, {
                headers: {
                    "X-AIO-Key": this.apiKey,
                },
                timeout: 10000,
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error(`Error getting data from Adafruit IO feed ${feedKey}:`, error.message);
            if (error.response) {
                console.error("Response error:", error.response.data);
            }
            return {
                success: false,
                error: error.response?.data || error.message,
            };
        }
    }

    /**
     * Lấy danh sách tất cả feeds từ Adafruit IO
     * @returns {Promise}
     */
    async getAllFeeds() {
        try {
            const response = await axios.get(`${this.baseURL}/feeds`, {
                headers: {
                    "X-AIO-Key": this.apiKey,
                },
                timeout: 10000,
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error("Error getting feeds from Adafruit IO:", error.message);
            if (error.response) {
                console.error("Response error:", error.response.data);
            }
            return {
                success: false,
                error: error.response?.data || error.message,
            };
        }
    }

    /**
     * Lấy thông tin chi tiết của một feed
     * @param {string} feedKey - Tên feed
     * @returns {Promise}
     */
    async getFeedInfo(feedKey) {
        try {
            const response = await axios.get(`${this.baseURL}/feeds/${feedKey}`, {
                headers: {
                    "X-AIO-Key": this.apiKey,
                },
                timeout: 10000,
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error(`Error getting feed info for ${feedKey}:`, error.message);
            if (error.response) {
                console.error("Response error:", error.response.data);
            }
            return {
                success: false,
                error: error.response?.data || error.message,
            };
        }
    }

    /**
     * Tạo feed mới trên Adafruit IO (nếu chưa tồn tại)
     * @param {string} feedKey - Tên feed
     * @param {string} description - Mô tả feed
     * @returns {Promise}
     */
    async createFeed(feedKey, description = "") {
        try {
            const response = await axios.post(
                `${this.baseURL}/feeds`,
                {
                    name: feedKey,
                    description: description,
                },
                {
                    headers: {
                        "X-AIO-Key": this.apiKey,
                        "Content-Type": "application/json",
                    },
                    timeout: 10000,
                }
            );
            return { success: true, data: response.data };
        } catch (error) {
            // Feed có thể đã tồn tại, không phải lỗi nghiêm trọng
            if (error.response?.status === 400 && error.response?.data?.error?.includes("already exists")) {
                return { success: true, data: { message: "Feed already exists" } };
            }
            console.error(`Error creating feed ${feedKey}:`, error.message);
            return {
                success: false,
                error: error.response?.data || error.message,
            };
        }
    }
}

module.exports = AdafruitService;
