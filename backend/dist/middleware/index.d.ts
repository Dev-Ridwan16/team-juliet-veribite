import { Request, Response, NextFunction } from "express";
export declare const generalLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const strictLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const errorHandler: (err: any, req: Request, res: Response, next: NextFunction) => void;
export declare const requestLogger: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateEthAddress: (req: Request, res: Response, next: NextFunction) => void;
export declare const sanitizeInput: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=index.d.ts.map