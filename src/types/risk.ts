export interface Risk {
  name: string;
  group?: string;
  probability?: string;
  impact?: string;
  score?: string;
  /** Sorting key: explicit score, or probability × impact if both numeric */
  computedScore?: number;
}

export interface ParseResult {
  risks: Risk[];
  error?: string;
}
