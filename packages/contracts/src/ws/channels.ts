export const Channels = {
  match:   (matchId: string) => `match:${matchId}`,
  overlay: (matchId: string) => `overlay:${matchId}`,
  admin:   (tournamentId: string) => `admin:${tournamentId}`,
} as const;
