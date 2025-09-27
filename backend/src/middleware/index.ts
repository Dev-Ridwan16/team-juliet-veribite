import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import logger from "../utils/logger";

// Rate limiting configurations
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: 15 * 60, // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(
      `Rate limit exceeded for IP: ${req.ip}, User-Agent: ${req.get(
        "User-Agent"
      )}`
    );
    res.status(429).json({
      error: "Too many requests from this IP, please try again later.",
      retryAfter: 15 * 60,
    });
  },
});

export const strictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 requests per windowMs for sensitive operations
  message: {
    error: "Too many sensitive requests from this IP, please try again later.",
    retryAfter: 5 * 60, // 5 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(
      `Strict rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`
    );
    res.status(429).json({
      error:
        "Too many sensitive requests from this IP, please try again later.",
      retryAfter: 5 * 60,
    });
  },
});

// Error handling middleware
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error("Error occurred:", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Handle specific error types
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

  // Default error response
  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

// Request logging middleware
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? "warn" : "info";

    logger[logLevel]("HTTP Request", {
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

// Ethereum address validation middleware
export const validateEthAddress = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
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

  // Normalize to lowercase
  if (address) req.body.address = address.toLowerCase();
  if (addressParam) req.params.address = addressParam.toLowerCase();

  next();
};

// Input sanitization middleware
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const sanitizeString = (str: string): string => {
    return str.trim().replace(/[<>]/g, "");
  };

  // Sanitize common string fields
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
