import axios from "axios";

// Cấu hình base URL cho API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Tạo axios instance
const apiClient = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor - thêm token vào header
apiClient.interceptors.request.use(
    (config) => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("token");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - xử lý lỗi chung
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
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
        birthday: string;
    }) => {
        const response = await apiClient.post("/auth/register", userData);
        return response.data;
    },

    // Đăng nhập
    login: async (credentials: { username: string; password: string }) => {
        const response = await apiClient.post("/auth/login", credentials);
        return response.data;
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
    createRoom: async (roomData: { name: string; description?: string; adaUsername?: string }) => {
        const response = await apiClient.post("/rooms", roomData);
        return response.data;
    },

    // Cập nhật phòng
    updateRoom: async (
        id: string,
        roomData: {
            name?: string;
            description?: string;
            isOccupied?: boolean;
            temperature?: { target?: number };
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
    createDevice: async (deviceData: {
        name: string;
        type: string;
        brand?: string;
        model?: string;
        room: string;
        properties?: Record<string, any>;
    }) => {
        const response = await apiClient.post("/devices", deviceData);
        return response.data;
    },

    // Cập nhật thiết bị
    updateDevice: async (
        id: string,
        deviceData: {
            name?: string;
            properties?: Record<string, any>;
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
