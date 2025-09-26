const { Sequelize } = require('sequelize');

// Create Sequelize instance
const sequelize = new Sequelize(
    process.env.DB_NAME || 'smart_home',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        dialectOptions: {
            ssl: process.env.DB_HOST.includes('azure.com') ? {
                require: true,
                rejectUnauthorized: false
            } : false,
            connectTimeout: 60000
        },
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            timestamps: true,
            underscored: true,
            freezeTableName: true
        }
    }
);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('📦 MySQL Connected successfully');
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
        process.exit(1);
    }
};

// Handle connection events
process.on('SIGINT', async () => {
    try {
        await sequelize.close();
        console.log('📦 MySQL connection closed through app termination');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error closing database connection:', error);
        process.exit(1);
    }
});

module.exports = { sequelize, connectDB };