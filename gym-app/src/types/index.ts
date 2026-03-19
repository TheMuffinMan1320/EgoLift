export interface Exercise {
  id: string;
  name: string;
  description: string;
  targetMuscles: string[];
}

export interface FrameAnalysis {
  timestamp: number;
  score: number; // 0-1, higher = better form
}

export interface AnalysisResult {
  exercise: string;
  overallScore: number; // 0-100
  isCorrectForm: boolean;
  feedback: string[];
  frameResults: FrameAnalysis[];
}

// RootStackParamList defines the screens and their navigation params
export type RootStackParamList = {
  ExerciseSelect: undefined;
  Camera: { exercise: Exercise };
  Analysis: { exercise: Exercise; videoUri: string };
};
