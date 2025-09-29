// Simple test để kiểm tra API connection
export const testAPI = async () => {
    console.log("Testing API connection...");
    try {
        const response = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: "khoatrandang020704",
                password: "test123T",
            }),
        });

        console.log("Response status:", response.status);
        console.log("Response headers:", Object.fromEntries(response.headers.entries()));

        const data = await response.json();
        console.log("Response data:", data);
        return data;
    } catch (error: any) {
        console.error("API test error:", error);
        console.error("Error type:", error.constructor?.name);
        console.error("Error message:", error.message);
        throw error;
    }
};
