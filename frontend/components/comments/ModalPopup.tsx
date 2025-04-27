import React, { ReactNode } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';

const { height: screenHeight } = Dimensions.get('window');

interface ModalPopupProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * A modal popup component that closes when clicking outside but not when clicking inside
 */
export function ModalPopup({
  visible,
  onClose,
  children,
}: ModalPopupProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* This is the dark overlay that covers the screen */}
        {/* When this is clicked, the modal closes */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        
        {/* This is the actual popup content */}
        {/* We wrap it in a TouchableWithoutFeedback to prevent clicks from propagating */}
        <View style={styles.popupContainer}>
          <TouchableWithoutFeedback>
            <View style={styles.popup}>
              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  popupContainer: {
    width: '100%',
    height: screenHeight * 0.8,
    position: 'absolute',
    bottom: 0,
  },
  popup: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '100%',
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
  },
});
