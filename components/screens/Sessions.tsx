import { useState, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Modal, Dimensions, Image } from 'react-native';
import Checkbox from 'expo-checkbox';
import styles from '../Stylesheet';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../app/firebase_config';
import Carousel from 'react-native-reanimated-carousel';
import { ICarouselInstance } from 'react-native-reanimated-carousel/lib/typescript/types';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';


export default function Sessions() {

  const [searchQuery, setSearchQuery] = useState('');
  const [showUploaded, setShowUploaded] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['Most Recent']);
  const [expandedSession, setExpandedSession] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const carouselRef = useRef<ICarouselInstance>(null);
  const currentIndex = useSharedValue(0);


  //6) Nothing on this screen is actually dynamic. It pulls pictures based on session "id"  == sessionTitle from the image capture screen
  //needs to pull sessions based on user and then build out the list of sessions and each sessions pictures
  const sessions = [
    { id: "", patient: 'Patient 321', limb: 'Right Arm', uploaded: true, description: 'Lesions observed on distal forearm and near crux of elbow.' },
    { id: 'Left Forearm (11/01/24)', patient: ' Patient 321', limb: 'Left Arm', uploaded: true, description: 'Lesions observed on distal forearm and near crux of elbow.' },
    { id: 'R Arm', patient: 'John Doe (id: 321)', limb: 'Right Arm', description: 'Lesions observed on distal forearm and near crux of elbow.' },
    { id: 'session4', patient: 'Patient 319', limb: 'Left Arm', uploaded: false },
  ];

  const handleExpand = (id: any) => {
    setExpandedSession(expandedSession === id ? null : id);
  };
  //should be some id, will use session title for now
  const handleShowImages = async (id: string) => {
    try {
      const session = sessions.find(s => s.id === id);
      setCurrentSession(session);

      const q = query(
        collection(db, "Images"), 
        where("sessionTitle", "==", id)
      );
      
      const querySnapshot = await getDocs(q);
      const imageUrls: string[] = [];
      querySnapshot.forEach((doc) => {
        imageUrls.push(doc.data().url);
      });

      setCurrentImages(imageUrls);
      setModalVisible(true);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev => {
      if (prev.includes(filter)) {
        return prev.filter(f => f !== filter);
      }
      return [...prev, filter];
    });
  };
  const renderSession = ({ item }: { item: { id: string; patient: string; limb: string; description?: string; uploaded?: boolean } }) => (
    <TouchableOpacity onPress={() => handleExpand(item.id)} style={[styles.sessionCard, expandedSession===item.id && styles.expandedCard]}>
      <View style={styles.sessionHeader}>
      <Ionicons
          name={item.uploaded ? 'cloud-done-outline' : 'cloud-offline-outline'}
          size={30}
          color="black"
          style={styles.icon}
      />
        <Text style={styles.sessionTitle}>
           {item.patient} {item.limb}
        </Text>
        <Ionicons
          style={styles.chevronIcon}
          name={expandedSession === item.id ? 'chevron-up-outline' : 'chevron-down-outline'}
          size={20}
          color="gray"
        />
      </View>
      {expandedSession === item.id && (
        <View style={styles.sessionDetails}>
          {item.description && <Text>{item.description}</Text>}
          <View style={styles.actions}>
          <TouchableOpacity style={styles.viewImagesButton} onPress={()=>handleShowImages(item.id)}>
            <Text style={styles.viewImagesButtonText}>View Images</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton}>
            <Text style={styles.submitButtonText}>Upload</Text>
          </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.sessionsContainer}>
      <View style={styles.sessionsHeaderContainer}>
      <Text style={styles.sessionsText}>Photo Sessions</Text>
      </View>
      <View style={styles.searchContainer}>
      <Ionicons
            name="search"
            size={30}
            color="black"
            style={styles.icon}
          />
      <TextInput
        style={styles.searchBar}
        placeholder="Search for a session..."
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

      <View style={styles.checkboxContainer}>
      <TouchableOpacity style={styles.checkboxContainer} onPress={() => setShowUploaded(!showUploaded)}>
      <Checkbox
        value={showUploaded}
        onValueChange={() => setShowUploaded(!showUploaded)}
        style={styles.checkbox}
        color={showUploaded ? '#2C2C2C' : undefined}
      />
      <Text style={styles.showUploadText}>Show uploaded sessions</Text>
      </TouchableOpacity>
      </View>
      <View style={styles.filters}>
      {['Most Recent', 'Session #', 'Patient #'].map((f) => (
    <TouchableOpacity
      key={f}
      style={[
        styles.filterButton,
        selectedFilters.includes(f) && styles.filterButtonSelected
      ]}
      onPress={() => toggleFilter(f)}
    >
      {selectedFilters.includes(f) && (
        <Ionicons
          name="checkmark"
          size={18}
          color="#fff"
          style={styles.checkmark}
        />
      )}
      <Text style={[
        styles.filterText,
        selectedFilters.includes(f) && styles.filterTextSelected
      ]}>
        {f}
      </Text>
    </TouchableOpacity>
  ))}
      </View>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={renderSession}
        contentContainerStyle={styles.list}
      />

<Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
            {/* 5) Hardcoded, needs to be dynamic */}
            <Text style={styles.carouselTitle}>John Doe (id: 321) - R Arm</Text>
            <View style={styles.carouselContainer}>
            <TouchableOpacity 
      style={styles.carouselButton}
      onPress={() => carouselRef.current?.prev()}
    >
      <Ionicons name="chevron-back" size={30} color="white" />
    </TouchableOpacity>
              <Carousel
                ref = {carouselRef}
                width={Dimensions.get('window').width - 40}
                height={300}
                data={currentImages}
                onProgressChange={(_, absoluteProgress) => {
                  currentIndex.value = absoluteProgress;
                }}
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: item }}
                    style={styles.carouselImage}
                    resizeMode="contain"
                  />
                )}
              />
                  <TouchableOpacity 
      style={[styles.carouselButton, styles.carouselButtonRight]}
      onPress={() => carouselRef.current?.next()}
    >
      <Ionicons name="chevron-forward" size={30} color="white" />
    </TouchableOpacity>
            </View>

            {currentSession && (
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionTitle}>
                  Patient {currentSession.patient} {currentSession.limb}
                </Text>
                {currentSession.description && (
                  <Text style={styles.sessionDescription}>
                    {currentSession.description}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};


