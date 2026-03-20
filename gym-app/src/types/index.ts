export interface Exercise {
  id: string;
  name: string;
  description: string;
  targetMuscles: string[];
}

// MoveNet outputs 17 keypoints, each with normalized (y, x) and a confidence score
export interface Keypoint {
  y: number;     // 0–1, from top of frame
  x: number;     // 0–1, from left of frame
  score: number; // 0–1 confidence
}

export type Pose = Keypoint[]; // always 17 items

// A post-it annotation anchored to a specific keypoint
export interface Annotation {
  keypointIndex: number; // which of the 17 keypoints to anchor to
  title: string;         // short error label
  tip: string;           // corrective cue
}

export interface FrameAnalysis {
  timestamp: number;
  score: number; // 0–1, higher = better form
  keypoints: Pose | null;
  annotations: Annotation[];
  thumbnailUri: string | null;
}

export interface AnalysisResult {
  exercise: string;
  overallScore: number; // 0–100
  isCorrectForm: boolean;
  feedback: string[];
  frameResults: FrameAnalysis[];
  // The frame with the worst score — used for the annotation display
  worstFrame: FrameAnalysis | null;
}

export type RootStackParamList = {
  ExerciseSelect: undefined;
  Camera: { exercise: Exercise };
  Analysis: { exercise: Exercise; videoUri: string };
};
