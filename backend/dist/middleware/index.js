"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeInput = exports.validateEthAddress = exports.requestLogger = exports.errorHandler = exports.strictLimiter = exports.generalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = __importDefault(require("../utils/logger"));
exports.generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        error: "Too many requests from this IP, please try again later.",
        retryAfter: 15 * 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_1.default.warn(`Rate limit exceeded for IP: ${req.ip}, User-Agent: ${req.get("User-Agent")}`);
        res.status(429).json({
            error: "Too many requests from this IP, please try again later.",
            retryAfter: 15 * 60,
        });
    },
});
exports.strictLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000,
    max: 10,
    message: {
        error: "Too many sensitive requests from this IP, please try again later.",
        retryAfter: 5 * 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_1.default.warn(`Strict rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
        res.status(429).json({
            error: "Too many sensitive requests from this IP, please try again later.",
            retryAfter: 5 * 60,
        });
    },
});
const errorHandler = (err, req, res, next) => {
    logger_1.default.error("Error occurred:", {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
    });
    if (err.name === "ValidationError") {
        res.status(400).json({
            error: "Validation Error",
            details: err.message,
        });
        return;
    }
    if (err.name === "CastError") {
        res.status(400).json({
            error: "Invalid data format",
            details: "Invalid ID or data type provided",
        });
        return;
    }
    if (err.code === 11000) {
        res.status(409).json({
            error: "Duplicate entry",
            details: "A record with this data already exists",
        });
        return;
    }
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === "production"
            ? "Internal Server Error"
            : err.message,
        ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        const logLevel = res.statusCode >= 400 ? "warn" : "info";
        logger_1.default[logLevel]("HTTP Request", {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get("User-Agent"),
        });
    });
    next();
};
exports.requestLogger = requestLogger;
const validateEthAddress = (req, res, next) => {
    const { address } = req.body;
    const addressParam = req.params.address;
    const targetAddress = address || addressParam;
    if (!targetAddress) {
        res.status(400).json({
            error: "Ethereum address is required",
        });
        return;
    }
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(targetAddress)) {
        res.status(400).json({
            error: "Invalid Ethereum address format",
        });
        return;
    }
    if (address)
        req.body.address = address.toLowerCase();
    if (addressParam)
        req.params.address = addressParam.toLowerCase();
    next();
};
exports.validateEthAddress = validateEthAddress;
const sanitizeInput = (req, res, next) => {
    const sanitizeString = (str) => {
        return str.trim().replace(/[<>]/g, "");
    };
    if (req.body) {
        if (typeof req.body.question === "string") {
            req.body.question = sanitizeString(req.body.question);
        }
        if (typeof req.body.prediction === "string") {
            req.body.prediction = sanitizeString(req.body.prediction);
        }
    }
    next();
};
exports.sanitizeInput = sanitizeInput;
//# sourceMappingURL=index.js.map