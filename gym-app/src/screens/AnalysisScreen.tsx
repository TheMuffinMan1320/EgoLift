import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, AnalysisResult, FrameAnalysis } from '../types';
import { analyzer } from '../services/TFLiteAnalyzer';

const SCREEN_WIDTH = Dimensions.get('window').width;
// Video is recorded in portrait, assume ~9:16 ratio; we display full width
const FRAME_DISPLAY_WIDTH = SCREEN_WIDTH - 32;
const FRAME_DISPLAY_HEIGHT = FRAME_DISPLAY_WIDTH * (16 / 9);

const CLIP_DURATION_MS = 9000; // matches CameraScreen max

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Analysis'>;
  route: RouteProp<RootStackParamList, 'Analysis'>;
};

export default function AnalysisScreen({ navigation, route }: Props) {
  const { exercise, videoUri } = route.params;
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const analysis = await analyzer.analyzeVideo(videoUri, exercise.name, CLIP_DURATION_MS);
        setResult(analysis);
      } catch (e) {
        setError('Analysis failed. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const scoreColor = (score: number) => {
    if (score >= 80) return '#34c759';
    if (score >= 60) return '#ff9f0a';
    return '#ff3b30';
  };

  const scoreLabel = (score: number) => {
    if (score >= 80) return 'Great Form';
    if (score >= 60) return 'Needs Work';
    return 'Poor Form';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Form Analysis</Text>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#e07b39" />
            <Text style={styles.loadingText}>Running pose analysis…</Text>
            <Text style={styles.loadingSubtext}>Checking {exercise.name} form across 8 frames</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {result && (
          <>
            {/* Score */}
            <View style={styles.scoreCard}>
              <View style={[styles.scoreCircle, { borderColor: scoreColor(result.overallScore) }]}>
                <Text style={[styles.scoreNumber, { color: scoreColor(result.overallScore) }]}>
                  {result.overallScore}
                </Text>
                <Text style={styles.scoreUnit}>/ 100</Text>
              </View>
              <Text style={[styles.scoreLabel, { color: scoreColor(result.overallScore) }]}>
                {scoreLabel(result.overallScore)}
              </Text>
            </View>

            {/* Worst frame with post-it annotations */}
            {result.worstFrame?.thumbnailUri && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Worst Frame</Text>
                <View style={[styles.frameContainer, { width: FRAME_DISPLAY_WIDTH, height: FRAME_DISPLAY_HEIGHT }]}>
                  <Image
                    source={{ uri: result.worstFrame.thumbnailUri }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                  />

                  {/* Post-it notes anchored to error keypoints */}
                  {result.worstFrame.annotations.map((annotation, i) => {
                    const kp = result.worstFrame!.keypoints![annotation.keypointIndex];
                    if (!kp || kp.score < 0.3) return null;

                    // Map normalised (y, x) → pixel position on the displayed frame
                    const top  = kp.y * FRAME_DISPLAY_HEIGHT;
                    const left = kp.x * FRAME_DISPLAY_WIDTH;

                    // Stagger overlapping notes
                    const offsetY = i * 12;

                    return (
                      <View
                        key={i}
                        style={[styles.postit, { top: Math.max(4, top - 80 - offsetY), left: Math.min(left, FRAME_DISPLAY_WIDTH - 160) }]}
                      >
                        {/* Connector dot */}
                        <View style={[styles.postitDot, { top: 80 + offsetY, left: 16 }]} />
                        <Text style={styles.postitTitle}>{annotation.title}</Text>
                        <Text style={styles.postitTip}>{annotation.tip}</Text>
                      </View>
                    );
                  })}

                  {result.worstFrame.annotations.length === 0 && (
                    <View style={styles.goodFormBadge}>
                      <Text style={styles.goodFormText}>✓ Good form on this frame</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Feedback list */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Feedback</Text>
              {result.feedback.map((line, i) => (
                <View key={i} style={styles.feedbackItem}>
                  <Text style={styles.feedbackBullet}>•</Text>
                  <Text style={styles.feedbackText}>{line}</Text>
                </View>
              ))}
            </View>

            {/* Frame timeline */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Frame Timeline</Text>
              <View style={styles.timeline}>
                {result.frameResults.map((frame, i) => {
                  const barH = Math.max(8, frame.score * 60);
                  const color = scoreColor(frame.score * 100);
                  return (
                    <View key={i} style={styles.timelineBar}>
                      <View style={[styles.bar, { height: barH, backgroundColor: color }]} />
                      <Text style={styles.timelineLabel}>{(frame.timestamp / 1000).toFixed(1)}s</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Muscles */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Target Muscles</Text>
              <View style={styles.muscleChips}>
                {exercise.targetMuscles.map((m) => (
                  <View key={m} style={styles.chip}>
                    <Text style={styles.chipText}>{m}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.replace('Camera', { exercise })}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('ExerciseSelect')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Change Exercise</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  header: { paddingTop: 20, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  exerciseName: { fontSize: 15, color: '#e07b39', fontWeight: '600', marginTop: 4 },

  loadingContainer: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  loadingText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loadingSubtext: { color: '#666', fontSize: 13 },

  errorContainer: { backgroundColor: '#2a1515', borderRadius: 12, padding: 16, marginVertical: 16 },
  errorText: { color: '#ff3b30', fontSize: 14, textAlign: 'center' },

  scoreCard: {
    alignItems: 'center', paddingVertical: 28, backgroundColor: '#1a1a1a',
    borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: '#2a2a2a',
  },
  scoreCircle: {
    width: 110, height: 110, borderRadius: 55, borderWidth: 6,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  scoreNumber: { fontSize: 38, fontWeight: '800' },
  scoreUnit: { color: '#555', fontSize: 12, marginTop: -4 },
  scoreLabel: { fontSize: 18, fontWeight: '700' },

  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: '#555',
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10,
  },

  // Frame + post-it overlay
  frameContainer: {
    borderRadius: 14, overflow: 'hidden',
    backgroundColor: '#1a1a1a', position: 'relative',
  },
  postit: {
    position: 'absolute',
    width: 155,
    backgroundColor: '#FFF176',
    borderRadius: 4,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
    // slight rotation for natural post-it feel
    transform: [{ rotate: '-2deg' }],
  },
  postitDot: {
    position: 'absolute',
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#e53935',
  },
  postitTitle: { fontSize: 11, fontWeight: '800', color: '#111', marginBottom: 3 },
  postitTip: { fontSize: 10, color: '#333', lineHeight: 14 },
  goodFormBadge: {
    position: 'absolute', bottom: 12, alignSelf: 'center',
    backgroundColor: 'rgba(52,199,89,0.85)', paddingHorizontal: 14,
    paddingVertical: 6, borderRadius: 20,
  },
  goodFormText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  feedbackItem: {
    flexDirection: 'row', gap: 10, marginBottom: 8,
    backgroundColor: '#1a1a1a', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  feedbackBullet: { color: '#e07b39', fontSize: 16, lineHeight: 22 },
  feedbackText: { color: '#ccc', fontSize: 13, lineHeight: 20, flex: 1 },

  timeline: {
    flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#1a1a1a',
    borderRadius: 14, padding: 12, gap: 6, height: 90,
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  timelineBar: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  bar: { width: '100%', borderRadius: 3, minHeight: 8 },
  timelineLabel: { color: '#555', fontSize: 9 },

  muscleChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#1e1610', borderWidth: 1, borderColor: '#e07b39',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },
  chipText: { color: '#e07b39', fontSize: 13, fontWeight: '600' },

  actions: { gap: 10, marginTop: 8 },
  primaryButton: { backgroundColor: '#e07b39', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryButton: {
    backgroundColor: '#1a1a1a', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a',
  },
  secondaryButtonText: { color: '#ccc', fontSize: 16, fontWeight: '600' },
});
