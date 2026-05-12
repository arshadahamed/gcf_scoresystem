import { z } from 'zod';

export const CreateTournamentSchema = z.object({
  name:   z.string().min(3).max(100),
  season: z.string().min(4).max(20),
  format: z.enum(['T10', 'T20', 'ODI', 'Custom']),
});
export type CreateTournamentDTO = z.infer<typeof CreateTournamentSchema>;

export const TournamentDTO = z.object({
  id:          z.string().uuid(),
  name:        z.string(),
  season:      z.string(),
  format:      z.enum(['T10', 'T20', 'ODI', 'Custom']),
  status:      z.enum(['draft', 'active', 'completed', 'cancelled']),
  organizerId: z.string().uuid(),
  createdAt:   z.string().datetime(),
});
export type TournamentDTO = z.infer<typeof TournamentDTO>;
