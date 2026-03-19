import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, AnalysisResult } from '../types';
import { analyzer } from '../services/TFLiteAnalyzer';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Analysis'>;
  route: RouteProp<RootStackParamList, 'Analysis'>;
};

// Estimated clip duration in ms (used for frame sampling; update if you track actual duration)
const DEFAULT_DURATION_MS = 8000;

export default function AnalysisScreen({ navigation, route }: Props) {
  const { exercise, videoUri } = route.params;
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const analysis = await analyzer.analyzeVideo(
          videoUri,
          exercise.name,
          DEFAULT_DURATION_MS,
        );
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Form Analysis</Text>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#e07b39" />
            <Text style={styles.loadingText}>Analyzing your form…</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {result && (
          <>
            {/* Score ring */}
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

            {/* Feedback */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Feedback</Text>
              {result.feedback.map((line, i) => (
                <View key={i} style={styles.feedbackItem}>
                  <Text style={styles.feedbackBullet}>•</Text>
                  <Text style={styles.feedbackText}>{line}</Text>
                </View>
              ))}
            </View>

            {/* Frame-by-frame timeline */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Frame Timeline</Text>
              <View style={styles.timeline}>
                {result.frameResults.map((frame, i) => {
                  const barHeight = Math.max(8, frame.score * 60);
                  const color = scoreColor(frame.score * 100);
                  return (
                    <View key={i} style={styles.timelineBar}>
                      <View style={[styles.bar, { height: barHeight, backgroundColor: color }]} />
                      <Text style={styles.timelineLabel}>{(frame.timestamp / 1000).toFixed(1)}s</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Targets */}
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
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  exerciseName: {
    fontSize: 15,
    color: '#e07b39',
    fontWeight: '600',
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    color: '#888',
    fontSize: 15,
  },
  errorContainer: {
    backgroundColor: '#2a1515',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    textAlign: 'center',
  },
  scoreCard: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  scoreNumber: {
    fontSize: 40,
    fontWeight: '800',
  },
  scoreUnit: {
    color: '#555',
    fontSize: 13,
    marginTop: -4,
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  feedbackItem: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  feedbackBullet: {
    color: '#e07b39',
    fontSize: 16,
    lineHeight: 22,
  },
  feedbackText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    gap: 6,
    height: 100,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  timelineBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 8,
  },
  timelineLabel: {
    color: '#555',
    fontSize: 9,
  },
  muscleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#1e1610',
    borderWidth: 1,
    borderColor: '#e07b39',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  chipText: {
    color: '#e07b39',
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    gap: 10,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#e07b39',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  secondaryButtonText: {
    color: '#ccc',
    fontSize: 16,
    fontWeight: '600',
  },
});
