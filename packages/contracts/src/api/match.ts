import { z } from 'zod';

export const CreateMatchSchema = z.object({
  tournamentId:    z.string().uuid(),
  teamAId:         z.string().uuid(),
  teamBId:         z.string().uuid(),
  venue:           z.string().optional(),
  scheduledAt:     z.string().datetime(),
  oversPerInnings: z.number().int().min(1).max(50),
});
export type CreateMatchDTO = z.infer<typeof CreateMatchSchema>;

export const TossDecisionSchema = z.object({
  winnerId: z.string().uuid(),
  decision: z.enum(['bat', 'bowl']),
});
export type TossDecisionDTO = z.infer<typeof TossDecisionSchema>;

export const MatchStatusEnum = z.enum(['scheduled', 'live', 'completed', 'abandoned']);

export const MatchDTO = z.object({
  id:              z.string().uuid(),
  tournamentId:    z.string().uuid(),
  teamAId:         z.string().uuid(),
  teamBId:         z.string().uuid(),
  teamAName:       z.string(),
  teamBName:       z.string(),
  venue:           z.string().nullable(),
  scheduledAt:     z.string().datetime(),
  oversPerInnings: z.number().int(),
  status:          MatchStatusEnum,
  tossWinnerId:    z.string().uuid().nullable(),
  tossDecision:    z.enum(['bat', 'bowl']).nullable(),
  winnerId:        z.string().uuid().nullable(),
  resultSummary:   z.string().nullable(),
});
export type MatchDTO = z.infer<typeof MatchDTO>;
