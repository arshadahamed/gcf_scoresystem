import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface LivePlayer {
  id: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
}

export interface LiveBowler {
  id: string;
  name: string;
  overs: string;
  runs: number;
  wickets: number;
}

export interface InningsState {
  inningsId: string | null;
  matchId: string | null;
  totalRuns: number;
  totalWickets: number;
  legalBalls: number;
  oversComplete: number;
  maxOvers: number;
  striker: LivePlayer | null;
  nonStriker: LivePlayer | null;
  bowler: LiveBowler | null;
  recentBalls: string[];
  isComplete: boolean;
  seq: number;
}

interface InningsStore extends InningsState {
  init: (init: Pick<InningsState, 'inningsId' | 'matchId' | 'maxOvers' | 'seq'>) => void;
  applyBall: (ball: {
    runs: number;
    extras: { wide: number; noBall: number; bye: number; legBye: number };
    isWicket: boolean;
  }) => void;
  undoLastBall: () => void;
  setStriker: (player: LivePlayer) => void;
  setNonStriker: (player: LivePlayer) => void;
  setBowler: (bowler: LiveBowler) => void;
  setFromServer: (state: Partial<InningsState>) => void;
}

export const useInningsStore = create<InningsStore>()(
  immer((set) => ({
    inningsId: null,
    matchId: null,
    totalRuns: 0,
    totalWickets: 0,
    legalBalls: 0,
    oversComplete: 0,
    maxOvers: 20,
    striker: null,
    nonStriker: null,
    bowler: null,
    recentBalls: [],
    isComplete: false,
    seq: 0,

    init: (init) => set((s) => {
      s.inningsId  = init.inningsId;
      s.matchId    = init.matchId;
      s.maxOvers   = init.maxOvers;
      s.seq        = init.seq;
    }),

    applyBall: (ball) => set((s) => {
      const totalExtras = ball.extras.wide + ball.extras.noBall + ball.extras.bye + ball.extras.legBye;
      s.totalRuns += ball.runs + totalExtras;

      const isIllegal = ball.extras.wide > 0 || ball.extras.noBall > 0;
      if (!isIllegal) {
        s.legalBalls++;
        s.oversComplete = Math.floor(s.legalBalls / 6);
      }

      if (ball.isWicket) s.totalWickets++;

      const symbol = ball.isWicket ? 'W'
        : ball.extras.wide > 0 ? 'Wd'
        : ball.extras.noBall > 0 ? 'Nb'
        : ball.runs === 0 ? '·'
        : String(ball.runs);

      s.recentBalls = [...s.recentBalls.slice(-29), symbol];
      s.seq++;

      if (s.striker && !isIllegal) {
        s.striker.balls++;
        s.striker.runs += ball.runs;
        if (ball.runs === 4) s.striker.fours++;
        if (ball.runs === 6) s.striker.sixes++;
      }

      if (s.legalBalls % 6 === 0 && s.legalBalls > 0) {
        const tmp = s.striker;
        s.striker = s.nonStriker;
        s.nonStriker = tmp;
      }

      if (s.totalWickets >= 10 || s.oversComplete >= s.maxOvers) {
        s.isComplete = true;
      }
    }),

    undoLastBall: () => set((s) => {
      if (s.seq === 0 || s.recentBalls.length === 0) return;
      s.recentBalls = s.recentBalls.slice(0, -1);
      s.seq = Math.max(0, s.seq - 1);
    }),

    setStriker: (player) => set((s) => { s.striker = player as LivePlayer; }),
    setNonStriker: (player) => set((s) => { s.nonStriker = player as LivePlayer; }),
    setBowler: (bowler) => set((s) => { s.bowler = bowler as LiveBowler; }),
    setFromServer: (state) => set((s) => Object.assign(s, state as object)),
  }))
);
