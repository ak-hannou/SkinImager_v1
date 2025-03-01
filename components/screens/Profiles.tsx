import React, { useEffect, useState, useCallback, useMemo } from 'react';
import * as MediaLibrary from 'expo-media-library';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, db } from '../../app/firebase_config';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  and,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import styles from '../Stylesheet';
import {
  Alert,
  Button,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

var profiles: any[] = [];

function App() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDOB] = useState('');
  const [placeholderFN, setPlaceholderFN] = useState<string>('First Name');
  const [placeholderLN, setPlaceholderLN] = useState<string>('Last Name');
  const [placeholderDOB, setPlaceholderDOB] = useState<string>('DOB');
  const [newProfile, openNewProfile] = useState(false);
  const [profileDetails, openProfileDetails] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [profiles, setProfiles] = useState<ProfileData>([]);

  type ProfileDataFields = {
    id: string;
    dob: string;
    firstName: string;
    lastName: string;
  };
  type ProfileData = ProfileDataFields[];

  //SO SKETCHY manually waiting to make sure the query finishes lol
  const fetchProfiles = useCallback(async () => {
    try {
      //setIsLoading(true);
      //setError(null);

      const querySnapshot = await getDocs(collection(db, 'Profiles'));
      const profileData: ProfileData = [];

      querySnapshot.forEach((doc) => {
        profileData.push({
          id: doc.id,
          dob: doc.data().dob,
          firstName: doc.data().firstName,
          lastName: doc.data().lastName,
        });
      });

      setProfiles(profileData);
    } catch (err) {
      console.error('Error fetching profiles:', err);
      //setError('Failed to fetch profiles');
    } finally {
      //setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const sortedProfiles = useMemo(() => {
    return [...profiles].sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, [profiles]);

  const newProfileModal = () => {
    return (
      <View style={styles.profileDetailsContainer}>
        <View>
          <MaterialIcons
            name="close"
            size={24}
            onPress={() => openNewProfile(false)}
          />
        </View>
        <View style={styles.profileRow}>
          <Text style={styles.profileDetailsTitle}>Patient Profiles</Text>
        </View>
        <View style={styles.profileDetailsWrapper}>
          <View style={styles.profileTextWrapper}>
            <Text style={styles.profileDetailsSubtitle}>First Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                placeholder={placeholderFN}
                value={firstName}
                onChangeText={setFirstName}
                onFocus={() => setPlaceholderFN('')}
                onBlur={() => setPlaceholderFN('First Name')}
              />
            </View>
          </View>
          <View style={styles.profileTextWrapper}>
            <Text style={styles.profileDetailsSubtitle}>Last Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
                onFocus={() => setPlaceholderLN('')}
                onBlur={() => setPlaceholderLN('Last Name')}
              />
            </View>
          </View>
          <View style={styles.profileTextWrapper}>
            <Text style={styles.profileDetailsSubtitle}>Date of Birth</Text>
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="DOB"
                value={dob}
                onChangeText={setDOB}
                onFocus={() => setPlaceholderDOB('')}
                onBlur={() => setPlaceholderDOB('DOB')}
              />
            </View>
          </View>
          <View style={styles.viewPhotoSessionButtonContainer}>
            <TouchableOpacity
              style={styles.viewPhotoSessionButton}
              onPress={() => {
                saveProfile(dob, firstName, lastName);
                openNewProfile(false);
                setFirstName('');
                setLastName('');
                setDOB('');
              }}
            >
              <Text style={styles.submitButtonText}>Save Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };
  const deleteProfile = async (profileId: string) => {
    try {
      Alert.alert(
        'Delete Profile',
        'Are you sure you want to delete this profile?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await deleteDoc(doc(db, 'Profiles', profileId));
              await fetchProfiles(); // Refresh profiles
              openProfileDetails(false); // Close modal
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error deleting profile:', error);
      Alert.alert('Error', 'Failed to delete profile');
    }
  };

  const profileDetailsModal = () => {
    return (
      <View style={styles.profileDetailsContainer}>
        <MaterialIcons
          name="close"
          size={24}
          onPress={() => openProfileDetails(false)}
        />

        <View style={styles.profileRow}>
          <Text style={styles.profileDetailsTitle}>Patient Profile</Text>
        </View>
        <View style={styles.profileDetailsWrapper}>
          <View style={styles.profileTextWrapper}>
            <Text style={styles.profileDetailsSubtitle}>Name</Text>
            <Text>
              {currentProfile ? currentProfile.firstName : firstName}{' '}
              {currentProfile ? currentProfile.lastName : lastName}
            </Text>
          </View>
          <View style={styles.profileTextWrapper}>
            <Text style={styles.profileDetailsSubtitle}>Date of Birth</Text>
            <Text>{currentProfile ? currentProfile.dob : dob}</Text>
          </View>
          <View style={styles.profileTextWrapper}>
            <Text style={styles.profileDetailsSubtitle}>
              Health Card Number
            </Text>
            <Text>Not registered</Text>
          </View>
          <View style={styles.profileTextWrapper}>
            <Text style={styles.profileDetailsSubtitle}>Notes</Text>
            <Text>No notes</Text>
          </View>

          <View style={styles.viewPhotoSessionButtonContainer}>
            <TouchableOpacity
              style={styles.viewPhotoSessionButton}
              onPress={() => {
                // saveProfile(dob, firstName, lastName);
                openProfileDetails(false);
                setCurrentProfile(null);
              }}
            >
              <Text style={styles.submitButtonText}>
                View Photo Sessions [todo]
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteProfile(currentProfile?.id)}
            >
              <View style={styles.deleteButtonContent}>
                <MaterialIcons name="delete" size={24} color="white" />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.container}></View>
      </View>
    );
  };

  async function saveProfile(dob: string, firstName: string, lastName: string) {
    try {
      const docRef = await addDoc(collection(db, 'Profiles'), {
        dob,
        firstName,
        lastName,
      });
      console.log('document saved correctly', docRef.id);
      await fetchProfiles();
    } catch (e) {
      console.log(e);
    }
  }

  const renderProfile = ({
    item,
  }: {
    item: { id: string; dob: string; firstName: string; lastName: string };
  }) => (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => {
          setCurrentProfile(item);
          openProfileDetails(true);
        }}
        style={[
          styles.profileCard,
          // expandedSession === item.id && styles.expandedCard,
        ]}
      >
        <View style={styles.sessionHeader}>
          <Ionicons
            name="person-circle-outline"
            size={30}
            color="black"
            style={styles.icon}
          />
          <Text style={styles.sessionTitle}>
            {item.firstName} {item.lastName}
          </Text>
          <Ionicons
            style={styles.chevronIcon}
            name="chevron-forward-outline"
            size={40}
            color="black"
          />
        </View>

        <View style={styles.profileDetails}>
          {item.dob && (
            <Text style={styles.profileDetailsText}>DOB: {item.dob}</Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.inputContainer}>
          <View style={styles.sessionsHeaderContainer}>
            <Text style={styles.sessionsText}>Patient Profiles</Text>
          </View>
          <TouchableOpacity
            style={styles.createProfileButton}
            onPress={() => openNewProfile(true)}
          >
            <Text style={styles.submitButtonText}>Create New Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={30} color="black" style={styles.icon} />
        <TextInput
          style={styles.searchBar}
          placeholder="Search for a patient..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons
              name="close-circle"
              size={20}
              color="#999"
              style={styles.clearIcon}
            />
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={sortedProfiles}
        keyExtractor={(profiles) => profiles.id}
        renderItem={renderProfile}
        contentContainerStyle={styles.list}
        extraData={profiles}
      />
      <Modal
        visible={newProfile}
        onRequestClose={() => openNewProfile(false)}
        animationType="slide"
      >
        {newProfileModal()}
      </Modal>
      <Modal
        visible={profileDetails}
        onRequestClose={() => openProfileDetails(false)}
        animationType="slide"
      >
        {profileDetailsModal()}
      </Modal>
    </View>
  );
}

export default App;
