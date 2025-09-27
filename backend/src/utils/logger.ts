import winston from "winston";

const { combine, timestamp, printf, colorize, json } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  return `${ts} [${level}]: ${message} ${
    Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
  }`;
});

// Create logger instance
export const logger = winston.createLogger({
  level: process.env["LOG_LEVEL"] || "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    process.env["NODE_ENV"] === "production"
      ? json()
      : combine(colorize(), logFormat)
  ),
  transports: [
    // Console transport
    new winston.transports.Console(),

    // File transport for errors
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // File transport for all logs
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ filename: "logs/exceptions.log" }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: "logs/rejections.log" }),
  ],
});

// If we're not in production, log to the console with colorized output
if (process.env["NODE_ENV"] !== "production") {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    })
  );
}

export default logger;
