export type LearningTimeInfo = {
  minHours: number;
  avgHours: number;
  maxHours: number;
  coursesAnalyzed: number;
};

export interface DurationEstimate {
  value: number;
  confidence: number;
}

export interface ConfidenceLevels {
  HIGH: number;
  MEDIUM: number;
  LOW: number;
}
