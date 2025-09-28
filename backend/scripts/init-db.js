const { sequelize } = require('../config/database');
const { User, Room, Device } = require('../models');

const initDatabase = async () => {
    try {
        console.log('🔄 Initializing database...');

        // Test connection
        await sequelize.authenticate();
        console.log('✅ Database connection established');

        // Check if admin user exists
        const adminExists = await User.findOne({ where: { username: 'admin' } });

        if (!adminExists) {
            // Create admin user
            const adminUser = await User.create({
                username: 'admin',
                email: 'admin@smarthome.com',
                password: 'admin123',
                name: 'Administrator',
                birthday: '1990-01-01',
                role: 'admin'
            });
            console.log('✅ Admin user created');

            // Create sample room
            const sampleRoom = await Room.create({
                name: 'Living Room',
                description: 'Main living area',
                ownerId: adminUser.id,
                temperatureTarget: 24,
                humidityTarget: 50
            });

            // Create sample device
            await Device.create({
                name: 'Smart Light',
                type: 'light',
                brand: 'Philips',
                model: 'Hue',
                roomId: sampleRoom.id,
                ownerId: adminUser.id,
                brightness: 80,
                color: '#ffffff'
            });

            console.log('✅ Sample data created');
        } else {
            console.log('ℹ️  Admin user already exists');
        }

        console.log('🎉 Database initialization completed');
        process.exit(0);

    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
};

// Run initialization
initDatabase();