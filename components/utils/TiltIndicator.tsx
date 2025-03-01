import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Accelerometer } from "expo-sensors";

const TILT_THRESHOLD = 15; // Degrees of tolerance
const UPDATE_INTERVAL = 100; // Sensor update interval (ms)

const isWithinThreshold = (angle: number) => {
  return (
    Math.abs(angle) < TILT_THRESHOLD || // Close to 0°
    Math.abs(angle - 90) < TILT_THRESHOLD || // Close to +90°
    Math.abs(angle + 90) < TILT_THRESHOLD || // Close to -90°
    Math.abs(angle - 180) < TILT_THRESHOLD || // Close to +180°
    Math.abs(angle + 180) < TILT_THRESHOLD // Close to -180°
  );
};

const TiltIndicator = () => {
  const [tilt, setTilt] = useState({ roll: 0, pitch: 0 });
  const rollAnim = useState(new Animated.Value(0))[0]; // Roll animation
  const pitchAnim = useState(new Animated.Value(0))[0]; // Pitch animation
  const backgroundAnim = useState(new Animated.Value(0))[0]; // Background color animation

  useEffect(() => {
    let subscription: { remove: any; };
    const startAccelerometer = async () => {
      subscription = Accelerometer.addListener(({ x, y, z }) => {
        const roll = (Math.atan2(y, z) * 180) / Math.PI;
        const pitch = (Math.atan2(-x, Math.sqrt(y * y + z * z)) * 180) / Math.PI;

        setTilt({ roll, pitch });

        const aligned = isWithinThreshold(roll) && isWithinThreshold(pitch);

        // Animate tilt lines
        Animated.spring(rollAnim, { toValue: roll, useNativeDriver: false }).start();
        Animated.spring(pitchAnim, { toValue: pitch, useNativeDriver: false }).start();

        // Animate background color
        Animated.timing(backgroundAnim, {
          toValue: aligned ? 1 : 0,
          duration: 300,
          useNativeDriver: false,
        }).start();
      });

      Accelerometer.setUpdateInterval(UPDATE_INTERVAL);
    };

    startAccelerometer();

    return () => {
      subscription && subscription.remove();
    };
  }, []);

  // Interpolating background color: red (0) for misaligned, green (1) for aligned
  const backgroundColor = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255, 0, 0, 0.3)", "rgba(0, 255, 0, 0.3)"],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.visualContainer, { backgroundColor }]}>
        {/* Roll Line (horizontal) */}
        <Animated.View
          style={[
            styles.rollLine,
            {
              transform: [{ rotate: rollAnim.interpolate({ inputRange: [-90, 90], outputRange: ["-90deg", "90deg"] }) }],
            },
          ]}
        />
        {/* Pitch Line (vertical) */}
        <Animated.View
          style={[
            styles.pitchLine,
            {
              transform: [{ rotate: pitchAnim.interpolate({ inputRange: [-90, 90], outputRange: ["-90deg", "90deg"] }) }],
            },
          ]}
        />
      </Animated.View>

      {/* Tilt Values */}
      <Text style={styles.info}>
        Roll: {tilt.roll.toFixed(1)}°, Pitch: {tilt.pitch.toFixed(1)}°
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: "center",
    justifyContent: "center",
  },
  visualContainer: {
    width: 100,
    height: 100,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  rollLine: {
    position: "absolute",
    width: 80,
    height: 3,
    backgroundColor: "blue",
  },
  pitchLine: {
    position: "absolute",
    width: 3,
    height: 80,
    backgroundColor: "red",
  },
  info: {
    fontSize: 14,
    color: "black",
    marginTop: 10,
  },
});

export default TiltIndicator;
