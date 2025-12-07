const { Sequelize } = require("sequelize");

// Create Sequelize instance
const sequelize = new Sequelize(
    process.env.DB_NAME || "smart_home",
    process.env.DB_USER || "root",
    process.env.DB_PASSWORD || "",
    {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
        dialect: "mysql",
        logging: process.env.NODE_ENV === "development" ? console.log : false,
        dialectOptions: {
            ssl:
                process.env.DB_HOST && process.env.DB_HOST.includes("azure.com")
                    ? {
                          require: true,
                          rejectUnauthorized: false,
                      }
                    : false,
            connectTimeout: 60000,
        },
        pool: {
            max: 5, // Giảm max connections để tránh quá tải
            min: 1, // Giữ ít nhất 1 connection active
            acquire: 60000, // Tăng thời gian chờ lấy connection (60s)
            idle: 20000, // Tăng thời gian idle trước khi đóng connection (20s)
            evict: 30000, // Kiểm tra connection idle mỗi 30s
        },
        retry: {
            max: 3, // Retry tối đa 3 lần
            match: [
                /ETIMEDOUT/,
                /ECONNRESET/,
                /ECONNREFUSED/,
                /EHOSTUNREACH/,
                /SequelizeConnectionError/,
                /SequelizeConnectionRefusedError/,
                /SequelizeHostNotFoundError/,
                /SequelizeHostNotReachableError/,
                /SequelizeInvalidConnectionError/,
                /SequelizeConnectionTimedOutError/,
            ],
        },
        define: {
            timestamps: true,
            underscored: true,
            freezeTableName: true,
        },
    }
);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        const isAzure = process.env.DB_HOST && process.env.DB_HOST.includes("azure.com");
        console.log("📦 MySQL Connected successfully");
        console.log(`   Host: ${process.env.DB_HOST || "localhost"}`);
        console.log(`   Database: ${process.env.DB_NAME || "smart_home"}`);
        console.log(`   SSL: ${isAzure ? "Enabled (Azure)" : "Disabled (Local)"}`);
    } catch (error) {
        console.error("❌ Database connection error:", error.message);
        console.error("\n💡 Troubleshooting tips:");
        
        if (process.env.DB_HOST && process.env.DB_HOST.includes("azure.com")) {
            console.error("   - Check Azure MySQL firewall rules (add your IP)");
            console.error("   - Verify username format: username@servername");
            console.error("   - Ensure SSL is enabled in Azure MySQL settings");
            console.error("   - Check if database 'smart_home' exists");
        } else {
            console.error("   - Is MySQL server running?");
            console.error("   - Check DB_HOST, DB_USER, DB_PASSWORD in .env file");
            console.error("   - Ensure database 'smart_home' exists");
        }
        
        process.exit(1);
    }
};

// Handle connection events
process.on("SIGINT", async () => {
    try {
        await sequelize.close();
        console.log(" MySQL connection closed through app termination");
        process.exit(0);
    } catch (error) {
        console.error(" Error closing database connection:", error);
        process.exit(1);
    }
});

module.exports = { sequelize, connectDB };
