export type LearningTimeInfo = {
  minHours: number;
  avgHours: number;
  maxHours: number;
  coursesAnalyzed: number;
};

export type Course = {
  id: string;
  title: string;
  description: string;
  learningTimeInfo: LearningTimeInfo;
  link: string;
  image?: string;
};
