import { z } from 'zod';

export const ExtrasSchema = z.object({
  wide:   z.number().int().min(0).default(0),
  noBall: z.number().int().min(0).default(0),
  bye:    z.number().int().min(0).default(0),
  legBye: z.number().int().min(0).default(0),
});
export type ExtrasDTO = z.infer<typeof ExtrasSchema>;

export const WicketSchema = z.object({
  kind: z.enum(['bowled','caught','lbw','run_out','stumped','hit_wicket','obstructing_field','retired_hurt']),
  dismissedPlayerId: z.string().uuid(),
  fielderId:         z.string().uuid().nullable(),
  bowlerId:          z.string().uuid().nullable(),
});
export type WicketDTO = z.infer<typeof WicketSchema>;

export const RecordBallSchema = z.object({
  inningsId:    z.string(),
  strikerId:    z.string().uuid(),
  nonStrikerId: z.string().uuid(),
  bowlerId:     z.string().uuid(),
  runs:         z.number().int().min(0).max(7),
  extras:       ExtrasSchema.default({}),
  wicket:       WicketSchema.nullable().default(null),
  expectedSeq:  z.number().int().min(0),
});
export type RecordBallDTO = z.infer<typeof RecordBallSchema>;

export const BallDTO = z.object({
  id:           z.string().uuid(),
  inningsId:    z.string(),
  seq:          z.number().int(),
  overNumber:   z.number().int(),
  ballInOver:   z.number().int(),
  strikerId:    z.string().uuid(),
  nonStrikerId: z.string().uuid(),
  bowlerId:     z.string().uuid(),
  runsOffBat:   z.number().int(),
  extras:       ExtrasSchema,
  wicket:       WicketSchema.nullable(),
  occurredAt:   z.string().datetime(),
});
export type BallDTO = z.infer<typeof BallDTO>;

export const InningsDTO = z.object({
  id:            z.string(),
  matchId:       z.string().uuid(),
  number:        z.union([z.literal(1), z.literal(2)]),
  battingTeamId: z.string().uuid(),
  bowlingTeamId: z.string().uuid(),
  totalRuns:     z.number().int(),
  totalWickets:  z.number().int(),
  legalBalls:    z.number().int(),
  oversDisplay:  z.string(),
  isComplete:    z.boolean(),
});
export type InningsDTO = z.infer<typeof InningsDTO>;
