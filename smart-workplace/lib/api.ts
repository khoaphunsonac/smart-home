import axios, { AxiosRequestConfig, AxiosError, AxiosHeaders } from "axios";

// Cấu hình base URL cho API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Tạo axios instance
const apiClient = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    timeout: 15000, // Tăng timeout lên 15 giây
    headers: {
        "Content-Type": "application/json",
    },
});

// Log API base URL khi khởi tạo (chỉ ở client-side)
if (typeof window !== "undefined") {
    console.log("API Base URL:", `${API_BASE_URL}/api`);
}

// Request interceptor - thêm token vào header
apiClient.interceptors.request.use(
    (config) => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("token");
            if (token) {
                if (!config.headers) {
                    config.headers = new AxiosHeaders();
                }
                config.headers.Authorization = `Bearer ${token}`;
            } else {
                console.log("No token found in localStorage");
            }
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response interceptor - xử lý lỗi chung
apiClient.interceptors.response.use(
    (response: any) => {
        return response;
    },
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Token hết hạn hoặc không hợp lệ
            if (typeof window !== "undefined") {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    // Đăng ký
    register: async (userData: {
        username: string;
        email: string;
        password: string;
        name: string;
        birthday?: string;
    }) => {
        try {
            console.log("Register API call with baseURL:", apiClient.defaults.baseURL);
            console.log("Register API payload:", { ...userData, password: "***" });
            const response = await apiClient.post("/auth/register", userData);
            console.log("Register API response:", response.data);
            return response.data;
        } catch (error: any) {
            console.error("Register API error:", error);
            console.error("Error details:", {
                message: error.message,
                code: error.code,
                response: error.response?.data,
                status: error.response?.status,
            });

            // Xử lý network errors
            if (error.code === "ECONNREFUSED" || error.code === "ERR_NETWORK" || error.message === "Network Error") {
                const networkError = new Error(
                    "Không thể kết nối đến server. Vui lòng kiểm tra backend có đang chạy không."
                );
                (networkError as any).isNetworkError = true;
                throw networkError;
            }

            throw error;
        }
    },

    // Đăng nhập
    login: async (credentials: { username: string; password: string }) => {
        try {
            console.log("Login API call with baseURL:", apiClient.defaults.baseURL);
            const response = await apiClient.post("/auth/login", credentials);
            console.log("Login API response:", response.data);
            return response.data;
        } catch (error: any) {
            console.error("Login API error:", error.response?.data || error.message);
            console.error("Full error:", error);
            throw error;
        }
    },

    // Lấy thông tin profile
    getProfile: async () => {
        const response = await apiClient.get("/users/profile");
        return response.data;
    },

    // Cập nhật profile
    updateProfile: async (userData: { name?: string; birthday?: string }) => {
        const response = await apiClient.put("/users/profile", userData);
        return response.data;
    },
};

// Rooms API
export const roomsAPI = {
    // Lấy danh sách phòng
    getRooms: async (params?: { page?: number; limit?: number }) => {
        const response = await apiClient.get("/rooms", { params });
        return response.data;
    },

    // Lấy thông tin một phòng
    getRoom: async (id: string) => {
        const response = await apiClient.get(`/rooms/${id}`);
        return response.data;
    },

    // Tạo phòng mới
    createRoom: async (roomData: { name: string; adaUsername?: string; adakey?: string }) => {
        const response = await apiClient.post("/rooms", roomData);
        return response.data;
    },

    // Cập nhật phòng
    updateRoom: async (
        id: string,
        roomData: {
            name?: string;
            isOccupied?: boolean;
            adaUsername?: string;
            adakey?: string;
        }
    ) => {
        const response = await apiClient.put(`/rooms/${id}`, roomData);
        return response.data;
    },

    // Xóa phòng
    deleteRoom: async (id: string) => {
        const response = await apiClient.delete(`/rooms/${id}`);
        return response.data;
    },
};

// Devices API
export const devicesAPI = {
    // Lấy danh sách thiết bị
    getDevices: async (params?: { page?: number; limit?: number; type?: string; room?: string }) => {
        const response = await apiClient.get("/devices", { params });
        return response.data;
    },

    // Lấy thông tin một thiết bị
    getDevice: async (id: string) => {
        const response = await apiClient.get(`/devices/${id}`);
        return response.data;
    },

    // Tạo thiết bị mới
    createDevice: async (deviceData: { name: string; type: string; room_id: number }) => {
        const response = await apiClient.post("/devices", deviceData);
        return response.data;
    },

    // Cập nhật thiết bị
    updateDevice: async (
        id: string,
        deviceData: {
            name?: string;
            isOn?: boolean;
        }
    ) => {
        const response = await apiClient.put(`/devices/${id}`, deviceData);
        return response.data;
    },

    // Bật/tắt thiết bị
    toggleDevice: async (id: string) => {
        const response = await apiClient.put(`/devices/${id}/toggle`);
        return response.data;
    },

    // Xóa thiết bị
    deleteDevice: async (id: string) => {
        const response = await apiClient.delete(`/devices/${id}`);
        return response.data;
    },
};

// Export axios instance cho các API tùy chỉnh khác
export default apiClient;

// Environment API
export const environmentAPI = {
    // Lấy dữ liệu môi trường cho một phòng
    getEnvironmentData: async (roomId: string, params?: { limit?: number }) => {
        const response = await apiClient.get(`/environment/${roomId}`, { params });
        return response.data;
    },

    // Lấy dữ liệu môi trường mới nhất cho một phòng
    getLatestEnvironmentData: async (roomId: string) => {
        const response = await apiClient.get(`/environment/${roomId}/latest`);
        return response.data;
    },

    // Tạo dữ liệu môi trường mới
    createEnvironmentData: async (
        roomId: string,
        data: {
            temperature?: number;
            humidity?: number;
            lightLevel?: number;
        }
    ) => {
        const response = await apiClient.post(`/environment/${roomId}`, data);
        return response.data;
    },
};

// Notifications API
export const notificationsAPI = {
    // Lấy danh sách thông báo
    getNotifications: async (params?: { page?: number; limit?: number }) => {
        const response = await apiClient.get("/notifications", { params });
        return response.data;
    },

    // Đánh dấu thông báo đã đọc
    markAsRead: async (id: string) => {
        const response = await apiClient.put(`/notifications/${id}/read`);
        return response.data;
    },

    // Tạo thông báo mới
    createNotification: async (data: { title: string; message: string; type?: string }) => {
        const response = await apiClient.post("/notifications", data);
        return response.data;
    },
};

// Usage History API
export const usageHistoryAPI = {
    // Lấy lịch sử sử dụng
    getUsageHistory: async (params?: { page?: number; limit?: number; room_id?: string; device_type?: string }) => {
        const response = await apiClient.get("/usage-history", { params });
        return response.data;
    },

    // Lấy thống kê sử dụng
    getUsageStats: async (params?: { period?: string }) => {
        const response = await apiClient.get("/usage-history/stats", { params });
        return response.data;
    },

    // Tạo bản ghi lịch sử sử dụng mới
    createUsageHistory: async (data: {
        room_id: number;
        deviceType: string;
        duration: number;
        energyConsumed?: number;
    }) => {
        const response = await apiClient.post("/usage-history", data);
        return response.data;
    },
};

// Adafruit IO API
export const adafruitAPI = {
    // Verify Adafruit IO credentials
    verifyCredentials: async (data: { adakey: string; adaUsername?: string }) => {
        const response = await apiClient.post("/adafruit/verify", data);
        return response.data;
    },

    // Lấy danh sách feeds từ Adafruit IO
    getFeeds: async (roomId: string) => {
        const response = await apiClient.get(`/adafruit/${roomId}/feeds`);
        return response.data;
    },

    // Lấy dữ liệu từ một feed
    getFeedData: async (roomId: string, feedKey: string, params?: { limit?: number }) => {
        const response = await apiClient.get(`/adafruit/${roomId}/feeds/${feedKey}`, { params });
        return response.data;
    },

    // Lấy thông tin chi tiết của một feed
    getFeedInfo: async (roomId: string, feedKey: string) => {
        const response = await apiClient.get(`/adafruit/${roomId}/feeds/${feedKey}/info`);
        return response.data;
    },

    // Gửi dữ liệu lên Adafruit IO
    sendData: async (roomId: string, data: { feedKey: string; value: string | number }) => {
        const response = await apiClient.post(`/adafruit/${roomId}/send`, data);
        return response.data;
    },

    // Sync environment data từ DB lên Adafruit IO
    syncEnvironmentData: async (roomId: string, params?: { limit?: number }) => {
        const response = await apiClient.post(`/adafruit/sync/${roomId}`, null, { params });
        return response.data;
    },

    // Sync devices từ Adafruit IO feeds vào database
    syncDevices: async (roomId: string) => {
        const response = await apiClient.post(`/adafruit/${roomId}/sync-devices`);
        return response.data;
    },
};
