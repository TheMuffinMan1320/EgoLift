import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';

const MAX_DURATION_SECONDS = 10;

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Camera'>;
  route: RouteProp<RootStackParamList, 'Camera'>;
};

export default function CameraScreen({ navigation, route }: Props) {
  const { exercise } = route.params;
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(MAX_DURATION_SECONDS);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasPermissions = cameraPermission?.granted && micPermission?.granted;
  const needsPermission = !cameraPermission?.granted || !micPermission?.granted;

  const requestPermissions = async () => {
    if (!cameraPermission?.granted) await requestCameraPermission();
    if (!micPermission?.granted) await requestMicPermission();
  };

  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;
    setIsRecording(true);
    setCountdown(MAX_DURATION_SECONDS);

    // Countdown timer
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      const video = await cameraRef.current.recordAsync({
        maxDuration: MAX_DURATION_SECONDS,
      });

      if (video?.uri) {
        navigation.replace('Analysis', {
          exercise,
          videoUri: video.uri,
        });
      }
    } catch (e) {
      console.error('Recording failed:', e);
    } finally {
      setIsRecording(false);
      if (countdownRef.current) clearInterval(countdownRef.current);
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current || !isRecording) return;
    if (countdownRef.current) clearInterval(countdownRef.current);
    await cameraRef.current.stopRecording();
  };

  if (needsPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>
          EgoLift needs camera and microphone access to record your exercise for form analysis.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
          <Text style={styles.permissionButtonText}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        mode="video"
      />

      {/* Top overlay */}
      <View style={styles.topOverlay}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.exerciseBadge}>
          <Text style={styles.exerciseBadgeText}>{exercise.name}</Text>
        </View>
      </View>

      {/* Recording indicator */}
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>REC  {countdown}s</Text>
        </View>
      )}

      {/* Instructions */}
      {!isRecording && (
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>Position yourself in frame</Text>
          <Text style={styles.instructionsBody}>
            Make sure your full body is visible. Tap Record when ready — you have {MAX_DURATION_SECONDS} seconds.
          </Text>
        </View>
      )}

      {/* Bottom controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordButtonActive]}
          onPress={isRecording ? stopRecording : startRecording}
          activeOpacity={0.8}
        >
          <View style={isRecording ? styles.stopIcon : styles.recordIcon} />
        </TouchableOpacity>
        <Text style={styles.controlHint}>
          {isRecording ? 'Tap to stop early' : 'Tap to record'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  permissionButton: {
    backgroundColor: '#e07b39',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  topOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseBadge: {
    backgroundColor: '#e07b39',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  exerciseBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  recordingIndicator: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff3b30',
  },
  recordingText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 1,
  },
  instructions: {
    position: 'absolute',
    bottom: 160,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 14,
    padding: 16,
  },
  instructionsTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 6,
  },
  instructionsBody: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 20,
  },
  controls: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 10,
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonActive: {
    borderColor: '#ff3b30',
    backgroundColor: 'rgba(255,59,48,0.2)',
  },
  recordIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ff3b30',
  },
  stopIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#ff3b30',
  },
  controlHint: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '500',
  },
});
