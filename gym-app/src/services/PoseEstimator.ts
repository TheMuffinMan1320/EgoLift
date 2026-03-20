/**
 * PoseEstimator
 * Runs the MoveNet Lightning TFLite model on a single video frame
 * and returns 17 body keypoints.
 *
 * Input tensor:  Int32Array [1 × 192 × 192 × 3], RGB values 0–255
 * Output tensor: Float32Array [51], layout: [y, x, score] × 17 keypoints
 */

import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import * as FileSystem from 'expo-file-system';
import { getThumbnailAsync } from 'expo-video-thumbnails';
import jpeg from 'jpeg-js';
import { Pose } from '../types';

const INPUT_SIZE = 192;

// MoveNet keypoint index constants
export const KP = {
  NOSE: 0,
  LEFT_EYE: 1,   RIGHT_EYE: 2,
  LEFT_EAR: 3,   RIGHT_EAR: 4,
  LEFT_SHOULDER: 5,  RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7,     RIGHT_ELBOW: 8,
  LEFT_WRIST: 9,     RIGHT_WRIST: 10,
  LEFT_HIP: 11,      RIGHT_HIP: 12,
  LEFT_KNEE: 13,     RIGHT_KNEE: 14,
  LEFT_ANKLE: 15,    RIGHT_ANKLE: 16,
} as const;

class PoseEstimator {
  private model: TensorflowModel | null = null;

  async load(): Promise<void> {
    if (this.model) return;
    this.model = await loadTensorflowModel(
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('../../assets/models/movenet_lightning.tflite'),
    );
  }

  /**
   * Extract a frame from the video at timeMs, run MoveNet, return 17 keypoints.
   * Returns null if the frame can't be processed (person not visible, etc.).
   */
  async estimatePose(videoUri: string, timeMs: number): Promise<{ pose: Pose; thumbnailUri: string } | null> {
    await this.load();
    if (!this.model) return null;

    try {
      // 1. Extract frame as JPEG
      const { uri } = await getThumbnailAsync(videoUri, { time: timeMs, quality: 1 });

      // 2. Read JPEG bytes (base64 → Uint8Array without Buffer dependency)
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      const bytes = base64ToUint8Array(base64);

      // 3. Decode JPEG → raw RGBA pixels
      const image = jpeg.decode(bytes, { useTArray: true });

      // 4. Resize to 192×192 and convert to Int32Array RGB (MoveNet input format)
      const input = preprocessImage(image);

      // 5. Run MoveNet inference
      const outputs = this.model.runSync([input]);
      const raw = outputs[0] as Float32Array; // 51 values: [y, x, score] × 17

      // 6. Parse keypoints
      const pose: Pose = Array.from({ length: 17 }, (_, i) => ({
        y: raw[i * 3],
        x: raw[i * 3 + 1],
        score: raw[i * 3 + 2],
      }));

      return { pose, thumbnailUri: uri };
    } catch (e) {
      console.warn(`PoseEstimator: frame at ${timeMs}ms failed`, e);
      return null;
    }
  }
}

// ─── helpers ────────────────────────────────────────────────────────────────

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function preprocessImage(image: { data: Uint8Array; width: number; height: number }): Int32Array {
  const tensor = new Int32Array(INPUT_SIZE * INPUT_SIZE * 3);
  const scaleX = image.width / INPUT_SIZE;
  const scaleY = image.height / INPUT_SIZE;

  for (let y = 0; y < INPUT_SIZE; y++) {
    for (let x = 0; x < INPUT_SIZE; x++) {
      const srcX = Math.min(Math.floor(x * scaleX), image.width - 1);
      const srcY = Math.min(Math.floor(y * scaleY), image.height - 1);
      const srcIdx = (srcY * image.width + srcX) * 4; // RGBA source
      const dstIdx = (y * INPUT_SIZE + x) * 3;

      tensor[dstIdx]     = image.data[srcIdx];     // R
      tensor[dstIdx + 1] = image.data[srcIdx + 1]; // G
      tensor[dstIdx + 2] = image.data[srcIdx + 2]; // B
    }
  }

  return tensor;
}

export const poseEstimator = new PoseEstimator();
