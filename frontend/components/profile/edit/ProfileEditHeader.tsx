import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface ProfileEditHeaderProps {
  onBack: () => void;
  onSave: () => void;
  isLoading: boolean;
  colors: any;
  paddingTop: number;
}

export const ProfileEditHeader: React.FC<ProfileEditHeaderProps> = ({
  onBack,
  onSave,
  isLoading,
  colors,
  paddingTop,
}) => {
  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.background,
          paddingTop: Platform.OS === 'ios' ? paddingTop : paddingTop + 10,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.headerButton}
        onPress={onBack}
        disabled={isLoading}
      >
        <Feather name="arrow-left" size={24} color={colors.text} />
      </TouchableOpacity>

      <Text style={[styles.headerTitle, { color: colors.text }]}>
        Edit Profile
      </Text>

      <TouchableOpacity
        style={[
          styles.saveButton,
          {
            backgroundColor: colors.tint,
            opacity: isLoading ? 0.6 : 1,
          },
        ]}
        onPress={onSave}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.saveButtonText}>Save</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
}); 