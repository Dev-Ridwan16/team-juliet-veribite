"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const middleware_1 = require("./middleware");
const logger_1 = __importDefault(require("./utils/logger"));
const predictions_1 = __importDefault(require("./routes/predictions"));
const users_1 = __importDefault(require("./routes/users"));
const admin_1 = __importDefault(require("./routes/admin"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3002;
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false
}));
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://veribite.com', 'https://www.veribite.com']
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use(middleware_1.requestLogger);
app.use('/api', middleware_1.generalLimiter);
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: '1.0.0'
    });
});
app.use('/api/predictions', predictions_1.default);
app.use('/api/users', users_1.default);
app.use('/api/admin', admin_1.default);
app.get('/', (req, res) => {
    res.json({
        message: 'VeriBite Backend API',
        version: '1.0.0',
        docs: '/api/docs',
        health: '/health'
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
    });
});
app.use(middleware_1.errorHandler);
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/veribite';
        await mongoose_1.default.connect(mongoUri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        logger_1.default.info('Connected to MongoDB successfully');
        mongoose_1.default.connection.on('error', (err) => {
            logger_1.default.error('MongoDB connection error:', err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.default.warn('MongoDB disconnected');
        });
        process.on('SIGINT', async () => {
            await mongoose_1.default.connection.close();
            logger_1.default.info('MongoDB connection closed due to app termination');
            process.exit(0);
        });
    }
    catch (error) {
        logger_1.default.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
};
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            logger_1.default.info(`🚀 VeriBite Backend running on port ${PORT}`);
            logger_1.default.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger_1.default.info(`🔗 Health check: http://localhost:${PORT}/health`);
            logger_1.default.info(`📡 API endpoints: http://localhost:${PORT}/api`);
        });
    }
    catch (error) {
        logger_1.default.error('Failed to start server:', error);
        process.exit(1);
    }
};
process.on('uncaughtException', (error) => {
    logger_1.default.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.default.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
if (require.main === module) {
    startServer();
}
exports.default = app;
//# sourceMappingURL=app.js.map