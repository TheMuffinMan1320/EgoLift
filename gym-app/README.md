# EgoLift

**AI-powered exercise form analysis for iOS.**

EgoLift records a short clip of you performing an exercise and uses on-device pose estimation to analyze your form in real time — no internet connection required. Errors are surfaced as post-it annotations pinned to the exact body part that needs correction.

---

## Features

- **Exercise picker** — choose from 10 common lifts on launch
- **10-second camera recording** — countdown timer, stop early at any time
- **On-device AI analysis** — MoveNet Lightning pose estimation runs entirely on your device
- **Post-it annotations** — error notes pinned to the relevant joint on the worst frame
- **Frame timeline** — per-frame form scores across the full clip
- **Angle-based rules** — biomechanically grounded checks for each exercise (no black-box classifier)
- **Pluggable TFLite slot** — drop in your own trained `.tflite` model when you're ready

### Supported exercises

| Exercise | Checks |
|---|---|
| Squat | Depth, knee cave, forward lean |
| Deadlift | Back rounding, hip height |
| Bench Press | Elbow flare, wrist alignment |
| Overhead Press | Lockout, lower back arch |
| Bicep Curl | Range of motion, shoulder swing |
| Push-Up | Hip sag, depth |
| Pull-Up | Dead hang, hip swing |
| Lunge | Depth, knee drift |
| Romanian Deadlift | Hip hinge, back rounding |

---

## How it works

```
Record clip → Extract 8 frames → MoveNet pose estimation
     → Joint angle rules → Annotate worst frame → Score + feedback
```

1. **MoveNet Lightning** extracts 17 body keypoints per frame (nose, shoulders, elbows, wrists, hips, knees, ankles)
2. **`FormAnalyzer`** applies biomechanical angle rules to each pose — e.g. knee angle < 100° for squat depth, knee x drift vs ankle x for knee cave
3. The **worst-scoring frame** is displayed with post-it notes anchored to the offending joints
4. An **overall score (0–100)** is computed as the average across all analyzed frames

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.83 + Expo SDK 55 |
| Language | TypeScript |
| Navigation | React Navigation (JS stack) |
| Camera | expo-camera |
| Pose estimation | MoveNet Lightning (TFLite) via react-native-fast-tflite |
| Frame extraction | expo-video-thumbnails |
| Image decoding | jpeg-js |

---

## Project structure

```
gym-app/
├── assets/
│   └── models/
│       └── movenet_lightning.tflite   # MoveNet pose estimator
├── src/
│   ├── screens/
│   │   ├── ExerciseSelectScreen.tsx   # Exercise picker (shown on launch)
│   │   ├── CameraScreen.tsx           # 10-second recording screen
│   │   └── AnalysisScreen.tsx         # Results + post-it annotations
│   ├── services/
│   │   ├── PoseEstimator.ts           # MoveNet TFLite inference
│   │   ├── FormAnalyzer.ts            # Angle-based form rules per exercise
│   │   └── TFLiteAnalyzer.ts          # Orchestrates frames → result
│   └── types/
│       └── index.ts                   # Shared TypeScript types
├── App.tsx                            # Navigation setup
└── metro.config.js                    # Enables .tflite asset bundling
```

---

## Getting started

### Prerequisites

- Node.js 18+
- Xcode 15+ (iOS builds only)
- A physical iOS device or simulator
- CocoaPods (`sudo gem install cocoapods`)

### Install

```bash
git clone <your-repo-url>
cd gym-app
npm install
cd ios && pod install && cd ..
```

### Run

```bash
# Build and install on a connected device (first run takes ~5 min)
npx expo run:ios --device --port 8082

# On subsequent runs, just start Metro
npx expo start --port 8082
```

> **Note:** EgoLift uses native modules (`react-native-fast-tflite`) and **cannot run in Expo Go**. You must use `npx expo run:ios` to build the native binary.

> **Port:** If you have another Expo app running on port 8081, use `--port 8082` to avoid bundle conflicts.

---

## Plugging in a custom TFLite model

The angle-rule engine works out of the box, but you can replace or augment it with a trained classifier.

### 1. Train your model

Collect labeled video clips → extract MoveNet keypoints per frame → train an LSTM classifier in a Kaggle notebook:

```
data/
  squat/
    correct/        # ~100 clips
    knees_caving/   # ~100 clips
    not_deep/       # ~100 clips
```

See the training guide in [`docs/training.md`](docs/training.md) *(coming soon)*.

### 2. Convert to TFLite

```python
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
tflite_model = converter.convert()

with open('exercise_classifier.tflite', 'wb') as f:
    f.write(tflite_model)
```

### 3. Drop it in

```
assets/models/exercise_classifier.tflite
```

### 4. Wire it up

Open `src/services/TFLiteAnalyzer.ts` and follow the comments marked `── REPLACE THIS BLOCK ──`. The expected contract:

| | Value |
|---|---|
| Input tensor | `Float32Array` — shape `[1, 192, 192, 3]`, RGB normalized `[0, 1]` |
| Output tensor | `Float32Array` — `[confidence_correct, confidence_incorrect]` |

---

## Camera tips for best results

- Stand **2–3 metres** from the phone
- Keep your **full body in frame** (head to ankles)
- Use **front or side view** — avoid top-down angles
- Ensure **good lighting** — avoid strong backlighting

---

## License

MIT
