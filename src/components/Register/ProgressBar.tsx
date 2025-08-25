import {useEffect, useMemo, useRef} from 'react';
import {Easing, Pressable, StyleSheet, View} from 'react-native';
import {Animated} from 'react-native';

type ProgressBarProps = {
  step: number;
  total?: number;
  onStepPress?: (n: number) => void;
  activeColor?: string;
  trackColor?: string;
  fillColor?: string; // (unused here but kept if you need)
  height?: number;
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  step,
  total = 6,
  onStepPress,
  activeColor = '#2563EB',
  trackColor = 'rgba(255,255,255,0.28)',
  height = 8,
}) => {
  const progress = useRef(new Animated.Value(0)).current;

  const clampedStep = Math.min(Math.max(step, 1), total);
  const fraction = useMemo(
    () => (total > 1 ? (clampedStep - 1) / (total - 1) : 0),
    [clampedStep, total],
  );

  useEffect(() => {
    Animated.timing(progress, {
      toValue: fraction,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [fraction, progress]);

  return (
    <View style={[styles.wrapper]}>
      {/* Track */}
      <View style={[styles.track, {height, backgroundColor: trackColor}]}>
        {/* Filled portion */}
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            backgroundColor: '#FFFFFF',
            width: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          }}
        />
      </View>

      {/* Dots */}
      <View
        style={styles.dotsRow}
        pointerEvents={onStepPress ? 'auto' : 'none'}>
        {Array.from({length: total}).map((_, i) => {
          const index = i + 1;
          const reached = index <= clampedStep;
          const isActive = index === clampedStep;

          return (
            <Pressable
              key={index}
              onPress={() => onStepPress?.(index)}
              style={styles.dotHit}>
              <View style={styles.dotOuter}>
                <View
                  style={[
                    styles.dotInner,
                    {
                      backgroundColor: reached ? activeColor : '#E5E7EB',
                      transform: [{scale: isActive ? 1.15 : 1}],
                      borderWidth: isActive ? 2 : 0,
                      borderColor: isActive ? 'white' : 'transparent',
                    },
                  ]}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default ProgressBar;

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 30,
  },
  track: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 0,
  },
  dotsRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotHit: {
    padding: 8, // larger touch target
  },
  dotOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
});
