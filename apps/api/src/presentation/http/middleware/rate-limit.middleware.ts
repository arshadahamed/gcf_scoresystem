import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { title: 'Too many requests', status: 429 },
});

export const scoreLimiter = rateLimit({
  windowMs: 10_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
