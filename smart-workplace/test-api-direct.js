// Test API call trực tiếp
const testAPI = async () => {
    try {
        // Login
        const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'testuser',
                password: 'password123'
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('Login response:', loginData);
        
        if (loginData.success && loginData.data.token) {
            // Get rooms
            const roomsResponse = await fetch('http://localhost:5000/api/rooms', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${loginData.data.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const roomsData = await roomsResponse.json();
            console.log('Rooms response:', roomsData);
            console.log('Rooms array:', roomsData.data.rooms);
        }
    } catch (error) {
        console.error('Test error:', error);
    }
};

// Run test
testAPI();
