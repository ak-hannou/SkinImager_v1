import React from "react";
import { Modal, Text, View, Animated, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import styles from "../Stylesheet";

interface IssuePopupProps {
  isVisible: boolean;
  fieldInfo: ("markers" | "background" | "sharpness" | "brightness")[];
  fadeAnim: Animated.Value;
  onClose: () => void;
}

const messages: Record<IssuePopupProps["fieldInfo"][number], string> = {
  markers: "Markers not detected in image",
  background: "Checkered background not found in image",
  sharpness: "Focus camera",
  brightness: "Increase image lighting",
};

const IssuePopup: React.FC<IssuePopupProps> = ({ isVisible, fieldInfo, fadeAnim, onClose }) => {
  return (
    <Modal transparent visible={isVisible} onRequestClose={onClose}>
      <Animated.View style={[styles.popupOverlay, { opacity: fadeAnim }]}>
        <View style={styles.popupContainer}>
          <Ionicons name="warning" size={40} color="#FFA500" />
          <Text style={styles.popupTitle}>Issues Detected</Text>
          <View style={styles.popupMessage}>
            {fieldInfo.length > 0 ? (
              fieldInfo.map((field) => (
                <Text key={field} style={styles.bulletPoint}>
                  • {messages[field]}
                </Text>
              ))
            ) : (
              <Text>No issues detected.</Text>
            )}
          </View>
          <TouchableOpacity style={styles.popupButton} onPress={onClose}>
            <Text style={styles.popupButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

export default IssuePopup;
