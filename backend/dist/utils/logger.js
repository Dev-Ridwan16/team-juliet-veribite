"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const { combine, timestamp, printf, colorize, json } = winston_1.default.format;
const logFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
    return `${ts} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""}`;
});
exports.logger = winston_1.default.createLogger({
    level: process.env["LOG_LEVEL"] || "info",
    format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), process.env["NODE_ENV"] === "production"
        ? json()
        : combine(colorize(), logFormat)),
    transports: [
        new winston_1.default.transports.Console(),
        new winston_1.default.transports.File({
            filename: "logs/error.log",
            level: "error",
            maxsize: 5242880,
            maxFiles: 5,
        }),
        new winston_1.default.transports.File({
            filename: "logs/combined.log",
            maxsize: 5242880,
            maxFiles: 10,
        }),
    ],
    exceptionHandlers: [
        new winston_1.default.transports.File({ filename: "logs/exceptions.log" }),
    ],
    rejectionHandlers: [
        new winston_1.default.transports.File({ filename: "logs/rejections.log" }),
    ],
});
if (process.env["NODE_ENV"] !== "production") {
    exports.logger.add(new winston_1.default.transports.Console({
        format: combine(colorize(), logFormat),
    }));
}
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map