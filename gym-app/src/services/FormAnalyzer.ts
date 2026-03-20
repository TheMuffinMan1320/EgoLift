/**
 * FormAnalyzer
 * Applies angle-based rules to a pose and returns form errors as annotations.
 * Each annotation is anchored to a specific MoveNet keypoint so the UI can
 * draw a post-it note at the right position on the frame.
 */

import { Annotation, Pose } from '../types';
import { KP } from './PoseEstimator';

// Minimum keypoint confidence to trust a joint for analysis
const CONFIDENCE_THRESHOLD = 0.3;

// ─── geometry helpers ────────────────────────────────────────────────────────

function angle(a: [number, number], b: [number, number], c: [number, number]): number {
  // Returns the angle (degrees) at point B in the triangle A-B-C
  const ba = [a[0] - b[0], a[1] - b[1]];
  const bc = [c[0] - b[0], c[1] - b[1]];
  const dot = ba[0] * bc[0] + ba[1] * bc[1];
  const magBa = Math.hypot(ba[0], ba[1]);
  const magBc = Math.hypot(bc[0], bc[1]);
  if (magBa === 0 || magBc === 0) return 0;
  return (Math.acos(Math.max(-1, Math.min(1, dot / (magBa * magBc)))) * 180) / Math.PI;
}

function kpXY(pose: Pose, idx: number): [number, number] {
  return [pose[idx].y, pose[idx].x]; // (row, col) for angle math
}

function visible(pose: Pose, ...indices: number[]): boolean {
  return indices.every((i) => pose[i].score >= CONFIDENCE_THRESHOLD);
}

// ─── per-exercise rule sets ──────────────────────────────────────────────────

function analyzeSquat(pose: Pose): Annotation[] {
  const errors: Annotation[] = [];

  // Depth — left knee angle should reach ≤ 100° at the bottom
  if (visible(pose, KP.LEFT_HIP, KP.LEFT_KNEE, KP.LEFT_ANKLE)) {
    const kneeAngle = angle(kpXY(pose, KP.LEFT_HIP), kpXY(pose, KP.LEFT_KNEE), kpXY(pose, KP.LEFT_ANKLE));
    if (kneeAngle > 110) {
      errors.push({ keypointIndex: KP.LEFT_KNEE, title: 'Too shallow', tip: 'Drive hips below knees — hit parallel' });
    }
  }

  // Knee cave — knee x should stay roughly over ankle x
  if (visible(pose, KP.LEFT_KNEE, KP.LEFT_ANKLE)) {
    const kneeDrift = Math.abs(pose[KP.LEFT_KNEE].x - pose[KP.LEFT_ANKLE].x);
    if (kneeDrift > 0.07) {
      errors.push({ keypointIndex: KP.LEFT_KNEE, title: 'Knees caving', tip: 'Push knees out over your pinky toes' });
    }
  }

  // Forward lean — shoulder should stay over or slightly in front of mid-foot
  if (visible(pose, KP.LEFT_SHOULDER, KP.LEFT_HIP, KP.LEFT_KNEE)) {
    const torsoAngle = angle(kpXY(pose, KP.LEFT_SHOULDER), kpXY(pose, KP.LEFT_HIP), kpXY(pose, KP.LEFT_KNEE));
    if (torsoAngle < 120) {
      errors.push({ keypointIndex: KP.LEFT_SHOULDER, title: 'Too much lean', tip: 'Chest up, keep torso more upright' });
    }
  }

  return errors;
}

function analyzeDeadlift(pose: Pose): Annotation[] {
  const errors: Annotation[] = [];

  // Back rounding — shoulder-hip angle relative to vertical
  if (visible(pose, KP.LEFT_SHOULDER, KP.LEFT_HIP, KP.LEFT_KNEE)) {
    const backAngle = angle(kpXY(pose, KP.LEFT_SHOULDER), kpXY(pose, KP.LEFT_HIP), kpXY(pose, KP.LEFT_KNEE));
    if (backAngle < 130) {
      errors.push({ keypointIndex: KP.LEFT_SHOULDER, title: 'Back rounding', tip: 'Neutral spine — chest up, lats engaged' });
    }
  }

  // Hip too high at start (squat-morning hybrid)
  if (visible(pose, KP.LEFT_HIP, KP.LEFT_KNEE, KP.LEFT_ANKLE)) {
    const hipAngle = angle(kpXY(pose, KP.LEFT_KNEE), kpXY(pose, KP.LEFT_HIP), kpXY(pose, KP.LEFT_SHOULDER));
    if (hipAngle > 150) {
      errors.push({ keypointIndex: KP.LEFT_HIP, title: 'Hips too high', tip: 'Push floor away — don\'t shoot hips up first' });
    }
  }

  return errors;
}

function analyzeBenchPress(pose: Pose): Annotation[] {
  const errors: Annotation[] = [];

  // Elbow flare — elbows should not be perpendicular to torso
  if (visible(pose, KP.LEFT_SHOULDER, KP.LEFT_ELBOW, KP.LEFT_WRIST)) {
    const elbowAngle = angle(kpXY(pose, KP.LEFT_SHOULDER), kpXY(pose, KP.LEFT_ELBOW), kpXY(pose, KP.LEFT_WRIST));
    if (elbowAngle > 160) {
      errors.push({ keypointIndex: KP.LEFT_ELBOW, title: 'Elbows flaring', tip: 'Tuck elbows 45–75° from torso' });
    }
  }

  // Wrist alignment — wrists should be over elbows
  if (visible(pose, KP.LEFT_ELBOW, KP.LEFT_WRIST)) {
    const drift = Math.abs(pose[KP.LEFT_WRIST].x - pose[KP.LEFT_ELBOW].x);
    if (drift > 0.08) {
      errors.push({ keypointIndex: KP.LEFT_WRIST, title: 'Wrist alignment', tip: 'Keep wrists stacked directly over elbows' });
    }
  }

  return errors;
}

function analyzeOverheadPress(pose: Pose): Annotation[] {
  const errors: Annotation[] = [];

  if (visible(pose, KP.LEFT_SHOULDER, KP.LEFT_ELBOW, KP.LEFT_WRIST)) {
    const lockout = angle(kpXY(pose, KP.LEFT_SHOULDER), kpXY(pose, KP.LEFT_ELBOW), kpXY(pose, KP.LEFT_WRIST));
    if (lockout < 160) {
      errors.push({ keypointIndex: KP.LEFT_ELBOW, title: 'Incomplete lockout', tip: 'Fully extend arms at the top' });
    }
  }

  // Core / back arch — hips should stay neutral
  if (visible(pose, KP.LEFT_SHOULDER, KP.LEFT_HIP, KP.LEFT_KNEE)) {
    const backAngle = angle(kpXY(pose, KP.LEFT_SHOULDER), kpXY(pose, KP.LEFT_HIP), kpXY(pose, KP.LEFT_KNEE));
    if (backAngle < 160) {
      errors.push({ keypointIndex: KP.LEFT_HIP, title: 'Lower back arching', tip: 'Brace core and tuck pelvis slightly' });
    }
  }

  return errors;
}

function analyzeBicepCurl(pose: Pose): Annotation[] {
  const errors: Annotation[] = [];

  // Elbow range of motion — should reach full flexion (~40°) and extension (~170°)
  if (visible(pose, KP.LEFT_SHOULDER, KP.LEFT_ELBOW, KP.LEFT_WRIST)) {
    const elbowAngle = angle(kpXY(pose, KP.LEFT_SHOULDER), kpXY(pose, KP.LEFT_ELBOW), kpXY(pose, KP.LEFT_WRIST));
    if (elbowAngle > 140) {
      errors.push({ keypointIndex: KP.LEFT_ELBOW, title: 'Incomplete curl', tip: 'Curl all the way up — squeeze at the top' });
    }
  }

  // Shoulder swinging — shoulder x should stay still
  if (visible(pose, KP.LEFT_SHOULDER, KP.LEFT_HIP)) {
    const shoulderForward = Math.abs(pose[KP.LEFT_SHOULDER].x - pose[KP.LEFT_HIP].x);
    if (shoulderForward > 0.1) {
      errors.push({ keypointIndex: KP.LEFT_SHOULDER, title: 'Shoulder swinging', tip: 'Keep elbows pinned to your sides' });
    }
  }

  return errors;
}

function analyzePushUp(pose: Pose): Annotation[] {
  const errors: Annotation[] = [];

  // Hip sag — hips should be in line with shoulder and ankle
  if (visible(pose, KP.LEFT_SHOULDER, KP.LEFT_HIP, KP.LEFT_ANKLE)) {
    const bodyLine = angle(kpXY(pose, KP.LEFT_SHOULDER), kpXY(pose, KP.LEFT_HIP), kpXY(pose, KP.LEFT_ANKLE));
    if (bodyLine < 160) {
      errors.push({ keypointIndex: KP.LEFT_HIP, title: 'Hip sag', tip: 'Squeeze glutes and core — keep body in a plank' });
    }
  }

  // Elbow angle at bottom should be ~90°
  if (visible(pose, KP.LEFT_SHOULDER, KP.LEFT_ELBOW, KP.LEFT_WRIST)) {
    const elbow = angle(kpXY(pose, KP.LEFT_SHOULDER), kpXY(pose, KP.LEFT_ELBOW), kpXY(pose, KP.LEFT_WRIST));
    if (elbow > 120) {
      errors.push({ keypointIndex: KP.LEFT_ELBOW, title: 'Not deep enough', tip: 'Lower chest until elbows reach 90°' });
    }
  }

  return errors;
}

function analyzePullUp(pose: Pose): Annotation[] {
  const errors: Annotation[] = [];

  // Elbow lockout at bottom
  if (visible(pose, KP.LEFT_SHOULDER, KP.LEFT_ELBOW, KP.LEFT_WRIST)) {
    const elbow = angle(kpXY(pose, KP.LEFT_SHOULDER), kpXY(pose, KP.LEFT_ELBOW), kpXY(pose, KP.LEFT_WRIST));
    if (elbow < 150) {
      errors.push({ keypointIndex: KP.LEFT_ELBOW, title: 'Dead hang first', tip: 'Start from a full dead hang each rep' });
    }
  }

  // Kipping — hips swinging
  if (visible(pose, KP.LEFT_SHOULDER, KP.LEFT_HIP, KP.LEFT_KNEE)) {
    const swing = Math.abs(pose[KP.LEFT_HIP].x - pose[KP.LEFT_SHOULDER].x);
    if (swing > 0.12) {
      errors.push({ keypointIndex: KP.LEFT_HIP, title: 'Hip swinging', tip: 'Engage core — avoid kipping' });
    }
  }

  return errors;
}

function analyzeLunge(pose: Pose): Annotation[] {
  const errors: Annotation[] = [];

  if (visible(pose, KP.LEFT_HIP, KP.LEFT_KNEE, KP.LEFT_ANKLE)) {
    const kneeAngle = angle(kpXY(pose, KP.LEFT_HIP), kpXY(pose, KP.LEFT_KNEE), kpXY(pose, KP.LEFT_ANKLE));
    if (kneeAngle > 110) {
      errors.push({ keypointIndex: KP.LEFT_KNEE, title: 'Not deep enough', tip: 'Lower back knee toward the floor' });
    }
  }

  // Knee over toe — front knee shouldn't cave inward
  if (visible(pose, KP.LEFT_KNEE, KP.LEFT_ANKLE)) {
    const drift = pose[KP.LEFT_KNEE].x - pose[KP.LEFT_ANKLE].x;
    if (Math.abs(drift) > 0.07) {
      errors.push({ keypointIndex: KP.LEFT_KNEE, title: 'Knee drift', tip: 'Keep front knee tracking over second toe' });
    }
  }

  return errors;
}

function analyzeRomanianDeadlift(pose: Pose): Annotation[] {
  const errors: Annotation[] = [];

  // Hip hinge — shoulders should move forward as hips push back
  if (visible(pose, KP.LEFT_SHOULDER, KP.LEFT_HIP, KP.LEFT_KNEE)) {
    const hipAngle = angle(kpXY(pose, KP.LEFT_SHOULDER), kpXY(pose, KP.LEFT_HIP), kpXY(pose, KP.LEFT_KNEE));
    if (hipAngle > 160) {
      errors.push({ keypointIndex: KP.LEFT_HIP, title: 'Not hinging', tip: 'Push hips back — this is a hip hinge, not a squat' });
    }
  }

  if (visible(pose, KP.LEFT_SHOULDER, KP.LEFT_HIP, KP.LEFT_KNEE)) {
    const backAngle = angle(kpXY(pose, KP.LEFT_SHOULDER), kpXY(pose, KP.LEFT_HIP), kpXY(pose, KP.LEFT_KNEE));
    if (backAngle < 120) {
      errors.push({ keypointIndex: KP.LEFT_SHOULDER, title: 'Back rounding', tip: 'Keep neutral spine throughout the movement' });
    }
  }

  return errors;
}

// ─── public API ──────────────────────────────────────────────────────────────

const ANALYZERS: Record<string, (pose: Pose) => Annotation[]> = {
  'Squat': analyzeSquat,
  'Deadlift': analyzeDeadlift,
  'Bench Press': analyzeBenchPress,
  'Overhead Press': analyzeOverheadPress,
  'Bicep Curl': analyzeBicepCurl,
  'Push-Up': analyzePushUp,
  'Pull-Up': analyzePullUp,
  'Lunge': analyzeLunge,
  'Romanian Deadlift': analyzeRomanianDeadlift,
};

export function analyzeForm(exerciseName: string, pose: Pose): Annotation[] {
  const fn = ANALYZERS[exerciseName];
  if (!fn) return [];
  return fn(pose);
}

/** 0–1 score based on how many rules passed */
export function formScore(annotations: Annotation[], exerciseName: string): number {
  const fn = ANALYZERS[exerciseName];
  if (!fn) return 1;
  // Each exercise has a known max number of checks; score = 1 - (errors / maxErrors)
  const maxErrors = 3; // conservative upper bound
  return Math.max(0, 1 - annotations.length / maxErrors);
}

export function buildFeedback(annotations: Annotation[]): string[] {
  if (annotations.length === 0) return ['Great form! No issues detected.'];
  return annotations.map((a) => `${a.title}: ${a.tip}`);
}
