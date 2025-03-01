import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import styles from '../Stylesheet';

interface ProgressModalProps {
  visible: boolean;
  onClose: () => void;
}

const stages = [
  "Checking for Checkerboard...",
  "Checking Sharpness...",
  "Checking Brightness...",
  "Checking for Markers..."
];

const ProgressModal: React.FC<ProgressModalProps> = ({ visible, onClose }) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [showOkButton, setShowOkButton] = useState(false);

  useEffect(() => {
    if (visible) {
      setShowOkButton(false);
      setCurrentStageIndex(0);

      let index = 0;
      const interval = setInterval(() => {
        index++;
        if (index < stages.length) {
          setCurrentStageIndex(index);
        } else {
          clearInterval(interval);
          setTimeout(() => setShowOkButton(true), 500);
        }
      }, 500);

      return () => clearInterval(interval);
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainerProgress}>
          {/* {!showOkButton ? (
            <>
              <ActivityIndicator size="large" color="#4A90E2" />
              <Text style={styles.loadingText}>{stages[currentStageIndex]}</Text>
            </>
          ) : (
            <>
              <Text style={styles.loadingText}>Verification Complete</Text>
              <TouchableOpacity style={styles.okButton} onPress={onClose}>
                <Text style={styles.okButtonText}>OK</Text>
              </TouchableOpacity>
            </>
          )} */}
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>{stages[currentStageIndex]}</Text>
        </View>
      </View>
    </Modal>
  );
};

export default ProgressModal;
