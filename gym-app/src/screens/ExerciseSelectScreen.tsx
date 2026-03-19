import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Exercise, RootStackParamList } from '../types';

const EXERCISES: Exercise[] = [
  { id: '1', name: 'Squat', description: 'Barbell or bodyweight squat', targetMuscles: ['Quads', 'Glutes', 'Hamstrings'] },
  { id: '2', name: 'Deadlift', description: 'Conventional or sumo deadlift', targetMuscles: ['Hamstrings', 'Glutes', 'Lower back'] },
  { id: '3', name: 'Bench Press', description: 'Flat barbell bench press', targetMuscles: ['Chest', 'Triceps', 'Shoulders'] },
  { id: '4', name: 'Overhead Press', description: 'Standing barbell press', targetMuscles: ['Shoulders', 'Triceps'] },
  { id: '5', name: 'Bicep Curl', description: 'Dumbbell or barbell curl', targetMuscles: ['Biceps'] },
  { id: '6', name: 'Push-Up', description: 'Bodyweight push-up', targetMuscles: ['Chest', 'Triceps', 'Core'] },
  { id: '7', name: 'Pull-Up', description: 'Bodyweight pull-up', targetMuscles: ['Lats', 'Biceps', 'Rear deltoids'] },
  { id: '8', name: 'Lunge', description: 'Walking or stationary lunge', targetMuscles: ['Quads', 'Glutes', 'Hamstrings'] },
  { id: '9', name: 'Romanian Deadlift', description: 'Hip-hinge movement', targetMuscles: ['Hamstrings', 'Glutes'] },
  { id: '10', name: 'Lat Pulldown', description: 'Cable lat pulldown', targetMuscles: ['Lats', 'Biceps'] },
];

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'ExerciseSelect'>;
};

export default function ExerciseSelectScreen({ navigation }: Props) {
  const renderItem = ({ item }: { item: Exercise }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Camera', { exercise: item })}
      activeOpacity={0.75}
    >
      <View style={styles.cardContent}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseDesc}>{item.description}</Text>
        <Text style={styles.muscles}>{item.targetMuscles.join(' · ')}</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>EgoLift</Text>
        <Text style={styles.subtitle}>Choose your exercise to analyze your form</Text>
      </View>
      <FlatList
        data={EXERCISES}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  cardContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  exerciseDesc: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  muscles: {
    fontSize: 11,
    color: '#e07b39',
    marginTop: 6,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  arrow: {
    fontSize: 24,
    color: '#444',
    marginLeft: 8,
  },
});
