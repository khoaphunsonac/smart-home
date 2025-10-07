// Simple test để kiểm tra API connection
export const testAPI = async () => {
    console.log("Testing API connection...");
    try {
        console.log("Making request to: http://localhost:5000/api/auth/login");

        const response = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: "khoatrandang020704",
                password: "test123T",
            }),
            mode: "cors", // Explicit CORS mode
        });

        console.log("Response status:", response.status);
        console.log("Response ok:", response.ok);
        console.log("Response headers:", Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Response data:", data);
        return data;
    } catch (error: any) {
        console.error("API test error:", error);
        console.error("Error type:", error.constructor?.name);
        console.error("Error message:", error.message);

        if (error.name === "TypeError" && error.message.includes("fetch")) {
            console.error("Network error - check if backend is running on port 5000");
        }

        throw error;
    }
};

// Test CORS preflight
export const testCORS = async () => {
    try {
        console.log("Testing CORS...");
        const response = await fetch("http://localhost:5000/api/auth/login", {
            method: "OPTIONS",
        });

        console.log("CORS preflight status:", response.status);
        console.log("CORS headers:", Object.fromEntries(response.headers.entries()));

        return response.status === 200 || response.status === 204;
    } catch (error) {
        console.error("CORS test failed:", error);
        return false;
    }
};
