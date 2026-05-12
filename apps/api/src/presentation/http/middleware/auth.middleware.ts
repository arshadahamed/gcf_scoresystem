import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '../../../config';

declare global {
  namespace Express {
    interface Request {
      user: { id: string; email: string; role: string };
    }
  }
}

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) { res.status(401).json({ title: 'Missing token', status: 401 }); return; }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) { res.status(401).json({ title: 'Invalid token', status: 401 }); return; }

  const { data: userRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single();

  req.user = {
    id:    data.user.id,
    email: data.user.email ?? '',
    role:  userRow?.role ?? 'viewer',
  };

  next();
};
