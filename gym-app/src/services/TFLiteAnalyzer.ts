import { AnalysisResult, FrameAnalysis } from '../types';
import { poseEstimator } from './PoseEstimator';
import { analyzeForm, buildFeedback, formScore } from './FormAnalyzer';

const FRAME_COUNT = 8; // frames sampled per clip

class TFLiteAnalyzer {
  async analyzeVideo(
    videoUri: string,
    exerciseName: string,
    durationMs: number,
  ): Promise<AnalysisResult> {
    const interval = Math.floor(durationMs / (FRAME_COUNT + 1));
    const frameResults: FrameAnalysis[] = [];

    for (let i = 1; i <= FRAME_COUNT; i++) {
      const timeMs = interval * i;
      const result = await poseEstimator.estimatePose(videoUri, timeMs);

      if (result) {
        const { pose, thumbnailUri } = result;
        const annotations = analyzeForm(exerciseName, pose);
        const score = formScore(annotations, exerciseName);
        frameResults.push({ timestamp: timeMs, score, keypoints: pose, annotations, thumbnailUri });
      } else {
        // Frame couldn't be processed (person out of frame, low light, etc.)
        frameResults.push({ timestamp: timeMs, score: 0.5, keypoints: null, annotations: [], thumbnailUri: null });
      }
    }

    const scoredFrames = frameResults.filter((f) => f.keypoints !== null);

    // No pose detected in any frame
    if (scoredFrames.length === 0) {
      return {
        exercise: exerciseName,
        overallScore: 0,
        isCorrectForm: false,
        feedback: [
          'Could not detect your pose in this clip.',
          'Make sure your full body is visible and the area is well-lit.',
          'Try stepping further back from the camera.',
        ],
        frameResults,
        worstFrame: null,
      };
    }

    const avgScore = scoredFrames.reduce((s, f) => s + f.score, 0) / scoredFrames.length;
    const overallScore = Math.round(avgScore * 100);

    // The worst frame is the most informative for showing errors
    const worstFrame = scoredFrames.reduce((a, b) => (a.score < b.score ? a : b));

    return {
      exercise: exerciseName,
      overallScore,
      isCorrectForm: overallScore >= 70,
      feedback: buildFeedback(worstFrame.annotations),
      frameResults,
      worstFrame,
    };
  }
}

export const analyzer = new TFLiteAnalyzer();
