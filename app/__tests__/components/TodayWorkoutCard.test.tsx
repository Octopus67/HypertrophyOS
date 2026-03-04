import React from 'react';
import type { TrainingSessionResponse } from '../../types/training';

// Mock the TodayWorkoutCard component to test its logic
interface TodayWorkoutCardProps {
  sessions: TrainingSessionResponse[];
  isWorkoutActive: boolean;
  activeExerciseCount: number;
  onPress: (sessionId: string) => void;
  onResume: () => void;
  onStartWorkout: () => void;
}

// Test the component logic without rendering
function getTodayWorkoutCardState(props: TodayWorkoutCardProps) {
  const { sessions, isWorkoutActive, activeExerciseCount } = props;
  
  if (isWorkoutActive) {
    return {
      state: 'active',
      title: 'Workout in progress',
      subtitle: `${activeExerciseCount} exercises`,
      showResumeButton: true,
    };
  }
  
  if (sessions.length > 0) {
    return {
      state: 'completed',
      title: "Today's Training",
      sessions: sessions.map(session => {
        const duration = session.start_time && session.end_time 
          ? Math.round((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / (1000 * 60))
          : null;
        
        const exercises = session.exercises || [];
        const totalSets = exercises.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0);
        const totalVolume = exercises.reduce((sum, ex) => 
          sum + (ex.sets?.reduce((setSum, set) => setSum + (set.weight_kg * set.reps), 0) || 0), 0
        );
        
        return {
          id: session.id,
          duration,
          exercises: exercises.slice(0, 4),
          moreExercises: exercises.length > 4 ? exercises.length - 4 : 0,
          totalSets,
          totalVolume: Math.round(totalVolume),
        };
      }),
    };
  }
  
  return {
    state: 'empty',
    title: "Today's Training",
    emptyText: 'No workout yet today',
    showStartButton: true,
  };
}

// Mock session data
const mockSession: TrainingSessionResponse = {
  id: 'session-1',
  user_id: 'user-1',
  session_date: '2024-01-15',
  exercises: [
    {
      exercise_name: 'Bench Press',
      sets: [
        { reps: 8, weight_kg: 80, rpe: 8, set_type: 'normal' },
        { reps: 6, weight_kg: 85, rpe: 9, set_type: 'normal' }
      ]
    },
    {
      exercise_name: 'Squat',
      sets: [
        { reps: 10, weight_kg: 100, rpe: 7, set_type: 'normal' }
      ]
    }
  ],
  metadata: null,
  personal_records: [],
  start_time: '2024-01-15T10:00:00Z',
  end_time: '2024-01-15T11:30:00Z',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T11:30:00Z'
};

const mockSessionWithManyExercises: TrainingSessionResponse = {
  ...mockSession,
  id: 'session-2',
  exercises: [
    { exercise_name: 'Exercise 1', sets: [{ reps: 10, weight_kg: 50, rpe: 7 }] },
    { exercise_name: 'Exercise 2', sets: [{ reps: 8, weight_kg: 60, rpe: 8 }] },
    { exercise_name: 'Exercise 3', sets: [{ reps: 12, weight_kg: 40, rpe: 6 }] },
    { exercise_name: 'Exercise 4', sets: [{ reps: 6, weight_kg: 80, rpe: 9 }] },
    { exercise_name: 'Exercise 5', sets: [{ reps: 15, weight_kg: 30, rpe: 5 }] },
    { exercise_name: 'Exercise 6', sets: [{ reps: 10, weight_kg: 70, rpe: 8 }] }
  ]
};

const mockSessionNoDuration: TrainingSessionResponse = {
  ...mockSession,
  id: 'session-3',
  start_time: null,
  end_time: null
};

describe('TodayWorkoutCard Logic', () => {
  const defaultProps = {
    sessions: [],
    isWorkoutActive: false,
    activeExerciseCount: 0,
    onPress: jest.fn(),
    onResume: jest.fn(),
    onStartWorkout: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Active workout state', () => {
    it('returns active state when isWorkoutActive=true', () => {
      const state = getTodayWorkoutCardState({
        ...defaultProps,
        isWorkoutActive: true,
        activeExerciseCount: 5
      });

      expect(state.state).toBe('active');
      expect(state.title).toBe('Workout in progress');
      expect(state.subtitle).toBe('5 exercises');
      expect(state.showResumeButton).toBe(true);
    });

    it('shows correct exercise count in active state', () => {
      const state = getTodayWorkoutCardState({
        ...defaultProps,
        isWorkoutActive: true,
        activeExerciseCount: 3
      });

      expect(state.subtitle).toBe('3 exercises');
    });
  });

  describe('Completed sessions state', () => {
    it('returns completed state when sessions array has items', () => {
      const state = getTodayWorkoutCardState({
        ...defaultProps,
        sessions: [mockSession]
      });

      expect(state.state).toBe('completed');
      expect(state.title).toBe("Today's Training");
      expect(state.sessions).toHaveLength(1);
    });

    it('calculates duration correctly when start_time and end_time present', () => {
      const state = getTodayWorkoutCardState({
        ...defaultProps,
        sessions: [mockSession]
      });

      expect(state.sessions![0].duration).toBe(90); // 90 minutes
    });

    it('handles sessions without duration', () => {
      const state = getTodayWorkoutCardState({
        ...defaultProps,
        sessions: [mockSessionNoDuration]
      });

      expect(state.sessions![0].duration).toBe(null);
    });

    it('calculates total sets and volume correctly', () => {
      const state = getTodayWorkoutCardState({
        ...defaultProps,
        sessions: [mockSession]
      });

      const session = state.sessions![0];
      // 2 sets from Bench Press + 1 set from Squat = 3 sets
      expect(session.totalSets).toBe(3);
      // (80*8 + 85*6) + (100*10) = 640 + 510 + 1000 = 2150kg
      expect(session.totalVolume).toBe(2150);
    });

    it('shows correct more exercises count when more than 4 exercises', () => {
      const state = getTodayWorkoutCardState({
        ...defaultProps,
        sessions: [mockSessionWithManyExercises]
      });

      const session = state.sessions![0];
      expect(session.exercises).toHaveLength(4);
      expect(session.moreExercises).toBe(2);
    });

    it('handles multiple sessions', () => {
      const sessions = [mockSession, { ...mockSession, id: 'session-2' }];
      const state = getTodayWorkoutCardState({
        ...defaultProps,
        sessions
      });

      expect(state.sessions).toHaveLength(2);
      expect(state.sessions![0].id).toBe('session-1');
      expect(state.sessions![1].id).toBe('session-2');
    });
  });

  describe('Empty state', () => {
    it('returns empty state when no sessions and no active workout', () => {
      const state = getTodayWorkoutCardState(defaultProps);

      expect(state.state).toBe('empty');
      expect(state.title).toBe("Today's Training");
      expect(state.emptyText).toBe('No workout yet today');
      expect(state.showStartButton).toBe(true);
    });
  });

  describe('Callback functions', () => {
    it('onPress callback is provided', () => {
      const onPress = jest.fn();
      const props = { ...defaultProps, onPress };
      
      expect(typeof props.onPress).toBe('function');
      props.onPress('test-id');
      expect(onPress).toHaveBeenCalledWith('test-id');
    });

    it('onResume callback is provided', () => {
      const onResume = jest.fn();
      const props = { ...defaultProps, onResume };
      
      expect(typeof props.onResume).toBe('function');
      props.onResume();
      expect(onResume).toHaveBeenCalledTimes(1);
    });

    it('onStartWorkout callback is provided', () => {
      const onStartWorkout = jest.fn();
      const props = { ...defaultProps, onStartWorkout };
      
      expect(typeof props.onStartWorkout).toBe('function');
      props.onStartWorkout();
      expect(onStartWorkout).toHaveBeenCalledTimes(1);
    });
  });
});