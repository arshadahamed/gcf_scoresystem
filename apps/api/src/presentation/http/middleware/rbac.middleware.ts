import type { RequestHandler } from 'express';

type Role = 'admin' | 'organizer' | 'scorer' | 'viewer';

const hierarchy: Record<Role, number> = {
  admin: 4, organizer: 3, scorer: 2, viewer: 1,
};

export const requireRole = (minRole: Role): RequestHandler =>
  (req, res, next) => {
    const userRole = (req.user?.role ?? 'viewer') as Role;
    if ((hierarchy[userRole] ?? 0) >= hierarchy[minRole]) {
      next();
    } else {
      res.status(403).json({ title: 'Forbidden', status: 403, required: minRole, actual: userRole });
    }
  };
