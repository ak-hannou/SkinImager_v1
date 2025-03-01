import React, { useState, useRef, useEffect } from 'react';

import {
  Alert,
  Button,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Modal,
  Animated,
  Platform
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, db } from '../../app/firebase_config';
import { collection, addDoc } from 'firebase/firestore';

import { Ionicons } from '@expo/vector-icons';
import styles from '../Stylesheet';
import TiltIndicator from '../utils/TiltIndicator';
import ProgressModal from '../utils/ProgressModal';
import IssuePopup from '../utils/IssuePopup';

type BodyPart = 'arm' | 'head' | 'leg' | 'hand' | 'body';
export default function ImageCapture() {
  const [facing, setFacing] = useState<CameraType>('back');

  //1) these need to be re-added but they aren't working for now
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] =
    MediaLibrary.usePermissions();
  const cameraRef = useRef<CameraView>(null);
  const [cameraTorch, setCameraTorch] = useState<boolean>(false);
  const [sessionTitle, setSessionTitle] = useState<string>('');
  const [placeholder, setPlaceholder] = useState<string>('Session Title');
  //const [cameraFlash, setCameraFlash] = React.useState<FlashMode>("off");
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart>('arm');
  const bodyParts: BodyPart[] = ['arm', 'hand', 'leg', 'head', 'body'];
  const [armCount, setArmCount] = useState(0);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [isGoodPicPopupVisible, setGoodPicPopupVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [progressModalVisible, setProgressModalVisible] = useState<boolean>(false);
  const [apiData, setApiData] = useState<any>(null);
  const [fieldInfo, setFieldInfo] = useState<any>([]);

  //2) redundant state variables here that need to be removed
  const [currentStep, setCurrentStep] = useState(0);
  const [stepPopup, setStepPopup] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false); // New state variable

  const [stepCheck, setStepCheck] = useState(false);

  const bodyPartImages: Record<BodyPart, any> = {
    hand: require('../../assets/images/hand.png'),
    arm: require('../../assets/images/arm1.png'),
    leg:  require('../../assets/images/leg.png'),
    head: require('../../assets/images/head.png'),
    body: require('../../assets/images/body.png'),
  };
  //for protocol steps
  const armImages = [
    require('../../assets/images/arm1.png'),
    require('../../assets/images/arm2.png'),
    require('../../assets/images/arm3.png'),
    require('../../assets/images/arm4.png'),
  ];

  const steps = [
    "Step 1: Align the forearm with the outline (wrist pronated). Ensure all 3 markers are visible, adequate lighting, and minimal camera tilt.",
    "Step 2: Align the forearm with the outline (wrist 90deg rotated). Ensure all 3 markers are visible, adequate lighting, and minimal camera tilt.",
    "Step 3: Align the forearm with the outline (back of forearm). Ensure all 3 markers are visible, adequate lighting, and minimal camera tilt.",
    "Step 4: Align the forearm with the outline (wrist 270deg rotated). Ensure all 3 markers are visible, adequate lighting, and minimal camera tilt."
  ];

  function toggleCameraFacing() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }
  function toggleCameraTorch() {
    setCameraTorch(!cameraTorch);
  }
  function handleBodyPartSelect(bodyPart: BodyPart) {
    setSelectedBodyPart(bodyPart);
    if(bodyPart === "arm") {
      setArmCount(0);
    }
  }
  //3) Permission handling needs to be re-added, it is currently broken but not sure why. app should work regardless

  // useEffect(() => {
  //   (async () => {
  //     const cameraStatus = await requestPermission();
  //     const mediaStatus = await requestMediaPermission();

  //     if (!cameraStatus?.granted || !mediaStatus?.granted) {
  //       Alert.alert(
  //         'Permissions Required',
  //         'Camera and media library access are needed to use this feature.',
  //         [
  //           {
  //             text: 'Grant Permissions',
  //             onPress: async () => {
  //               const newCameraStatus = await requestPermission();
  //               const newMediaStatus = await requestMediaPermission();
  //               console.log('After grant permissions:', {
  //                 camera: newCameraStatus?.granted,
  //                 media: newMediaStatus?.granted,
  //               });
  //             },
  //           },
  //           {
  //             text: 'Cancel',
  //             style: 'cancel',
  //           },
  //         ]
  //       );
  //     }
  //   })();
  // }, [permission?.granted, mediaPermission?.granted]); // Add dependencies

  // if (!permission?.granted || !mediaPermission?.granted) {
  //   return (
  //     <View style={styles.container}>
  //       <Text style={styles.message}>
  //         We need your permission to use the camera and save photos
  //       </Text>
  //       <Button
  //         title="Grant Permissions"
  //         onPress={async () => {
  //           const newCameraStatus = await requestPermission();
  //           const newMediaStatus = await requestMediaPermission();
  //           console.log('Button press permissions:', {
  //             camera: newCameraStatus?.granted,
  //             media: newMediaStatus?.granted,
  //           });
  //         }}
  //       />
  //     </View>
  //   );
  // }

  // useEffect(() => {
  //   if(!stepCheck) {
  //     setStepCheck(true);
  //   }
  //   else {
  //     setStepPopup(true);
  //   }
  // },  [selectedBodyPart]);

  //don't use this anymore because lighting is checked in the Flask server now
  const LightingAlert = () => {
    useEffect(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      // <Modal
      //   transparent
      //   visible={isPopupVisible}
      //   onRequestClose={() => setIsPopupVisible(false)}
      // >
      //   <Animated.View style={[styles.popupOverlay, { opacity: fadeAnim }]}>
      //     <View style={styles.popupContainer}>
      //       <Ionicons name="warning" size={40} color="#FFA500" />
      //       <Text style={styles.popupTitle}>Poor Lighting Detected</Text>
      //       <Text style={styles.popupMessage}>
      //         The image appears to be too dark or poorly lit. Please try taking
      //         the picture in better lighting conditions.
      //       </Text>
      //       <TouchableOpacity
      //         style={styles.popupButton}
      //         onPress={() => setIsPopupVisible(false)}
      //       >
      //         <Text style={styles.popupButtonText}>OK</Text>
      //       </TouchableOpacity>
      //     </View>
      //   </Animated.View>
      // </Modal>
      <IssuePopup isVisible={isPopupVisible} fieldInfo={fieldInfo} fadeAnim={fadeAnim} onClose={() => setIsPopupVisible(false)} />
    );
  };

  const ImageCaptureSuccess = () => {
    useEffect(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Modal
        transparent
        visible={isGoodPicPopupVisible}
        onRequestClose={() => setGoodPicPopupVisible(false)}
      >
        <Animated.View style={[styles.popupOverlay, { opacity: fadeAnim }]}>
          <View style={styles.popupContainer}>
            <Ionicons name="checkmark-circle-outline" size={40} color="green" />
            <Text style={styles.popupTitle}>Image Successfully Captured</Text>
            <Text style={styles.popupMessage}>
              Image has been successfully captured and saved to the database.
            </Text>
            <TouchableOpacity
              style={styles.popupButton}
              onPress={() => setGoodPicPopupVisible(false)}
            >
              <Text style={styles.popupButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>
    );
  };

  //Done on flask server now
  async function checkImageLighting(uri: string | undefined) {
    try {
      // First compress and resize the image to make processing more efficient
      if (!uri) {
        throw new Error('Image URI is undefined');
      }
      const manipulatedImage = await manipulateAsync(uri, [], {
        compress: 0.7,
        format: SaveFormat.JPEG,
        base64: true,
      });
      // Convert base64 to array of RGB values
      const base64Image = manipulatedImage.base64;
      if (!base64Image) {
        throw new Error('Base64 image data is undefined');
      }
      const binaryString = atob(base64Image);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      // Calculate average brightness
      let totalBrightness = 0;
      let pixelCount = 0;

      for (let i = 0; i < bytes.length; i++) {
        const r = bytes[i];
        const g = bytes[i + 1];
        const b = bytes[i + 2];

        const byte = 0.299 * r + 0.587 * g + 0.114 * b;
        if (!isNaN(byte)) {
          totalBrightness += byte;
          pixelCount++;
        }
      }
      //Very suspect approach right now, will need to refine/test
      const lighting = totalBrightness / pixelCount;
      console.log('Average lighting:', lighting);
      if (lighting > 120) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
    }
  }

  async function handleTakePicture() {

    try {
      const response = await cameraRef.current?.takePictureAsync({
        base64: true,
      });
      if (response) {
        console.log('Picture taken:', response!.uri);
        const asset = await MediaLibrary.createAssetAsync(response.uri);
        const album = await MediaLibrary.getAlbumAsync('SkinImager');
        //This double saves (on android anyways) -- womp womp
        if (album) {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, true);
        } else {
          await MediaLibrary.createAlbumAsync('SkinImager', asset, true);
        }
        if (asset) {
          const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
          //const validLighting = await checkImageLighting(assetInfo?.localUri);
          uploadImage(assetInfo.localUri, "image");
        }
      }
    } catch (error) {
      console.error('Error taking picture:', error);
    }
  }

  type Photo = {
    uri: string;
    type: string;
  };
  
  const createFormData = (photo: Photo, body: { [key: string]: any } = {}) => {
    const data = new FormData();
  
    data.append('photo', {
      uri: Platform.OS === 'ios' ? photo.uri.replace('file://', '') : photo.uri,
      type: photo.type,
      name: photo.uri.split('/').pop(),
    } as any);
  
    Object.keys(body).forEach((key) => {
      data.append(key, body[key]);
    });
  
    return data;
  };

  async function uploadImage(uri: string | undefined, fileType: string) {
    console.log('Uploading image...');
    setProgressModalVisible(true);
    if (!uri) {
      throw new Error('Image URI is undefined');
    }

      fetch(`http://192.168.40.8:5000/upload`, { //This is the expo local server. this is the only url that will work nicely for us (change it to your local expo server url when testing)
        method: 'POST',
        body: createFormData({ uri, type: 'image/jpeg' }, { userId: '123' }), //can add other metadata here, userId is just a placeholder
      })
        .then((response) => response.json())
        .then((response) => {
          console.log('response', response);
           setApiData(response);
           displayModal(response, uri);

          //parse response: if all good then modal saying image uploaded successfully
          // if anything wrong then inform user to re-take with better conditions (outline issues)
          
        })
        .catch((error) => {
          console.log(uri)
          console.log('error', error);
        })
        .finally(() => {
          setTimeout(() => {
            setProgressModalVisible(false);
          }, 3000);
        })
    

        // const re = await fetch(uri);
        // const blob = await re.blob();
        // const storageRef = ref(storage, 'TestPics/' + new Date().getTime());
    // const uploadTask = uploadBytesResumable(storageRef, blob);
    // // listen for events
    // uploadTask.on(
    //   'state_changed',
    //   (snapshot) => {
    //     const progress =
    //       (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    //   },
    //   (error) => {
    //     // handle error
    //   },
    //   () => {
    //     getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
    //       console.log('File available at', downloadURL);
    //       // save record
    //       await saveRecord(
    //         fileType,
    //         downloadURL,
    //         new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
    //       );
    //     });
    //   }
    // );
      };

      async function uploadAndSaveImage(uri: string, fileType: string) {
        try {
          console.log('Uploading image...');      
          // Convert image URI to blob
          const re = await fetch(uri);
          const blob = await re.blob();
          
          // Generate Firebase storage reference
          const storageRef = ref(storage, 'TestPics/' + new Date().getTime());
          const uploadTask = uploadBytesResumable(storageRef, blob);
      
          // Wait for upload to complete
            uploadTask.on(
              'state_changed',
              (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log(`Upload progress: ${progress}%`);
              },
              (error) => {
                console.error('Upload error:', error);
              },
              async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                console.log('File available at:', downloadURL);
      
                // Save metadata to Firestore
                  await saveRecord(
                    fileType,
                    downloadURL,
                    new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
                  );                
              }
            );
        } catch (error) {
          console.error('Error uploading and saving image:', error);
        } finally {
        }
      }
async function displayModal(response: any, uri: string) {
  console.log("here")
  const apiData = response;
  if (apiData) {
    console.log(apiData.data["result"])
    if (!apiData.data["result"]) { //Put this back to true after testing
      setGoodPicPopupVisible(true);
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
        setStepPopup(true);
        setArmCount(armCount + 1);
        //UPLOAD IMAGE
        await uploadAndSaveImage(uri, "image/jpeg");
        console.log("Image uploaded: " + armCount);  
      } else {
        Alert.alert("Success", "All images captured successfully!");
      }
    } else {
      setFieldInfo(apiData.data["bad_fields"]);
      console.log(fieldInfo);
      setIsPopupVisible(true);
    }
  }
}
  async function saveRecord(fileType: string, url: string, createdAt: string) {
    try {
      //add fields in here to map to user/session/patient
      const docRef = await addDoc(collection(db, 'Images'), {
        fileType,
        url,
        createdAt,
        sessionTitle,
        selectedBodyPart,
      });
      console.log('document saved correctly', docRef.id);
    } catch (e) {
      console.log(e);
    }
  }
  const handleStartSession = () => {
    setSessionStarted(true);
    setStepPopup(true); // Show the step 1 popup
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.profileRow}>
          <Ionicons
            name="person-circle-outline"
            size={30}
            color="black"
            style={styles.icon}
          />
          {/* 4) This is hardcoded for now, will need to be dynamic */}
          <Text style={styles.profileText}>Patient Profile: John Doe</Text> 
        </View>
        <View style={styles.inputContainer}>
        {sessionStarted ? (
    // Display session title only
    <Text style={styles.sessionTitleText}>{sessionTitle}</Text>
  ) : (
    // Show input field and button when session has not started
    <>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={sessionTitle}
        onChangeText={setSessionTitle}
        onFocus={() => setPlaceholder('')}
        onBlur={() => setPlaceholder('Session Title')}
      />
      <TouchableOpacity style={styles.submitButton} onPress={handleStartSession}>
        <Text style={styles.submitButtonText}>Start Session</Text>
      </TouchableOpacity>
    </>
  )}
        </View>
      </View>
      
      <CameraView
        style={styles.camera}
        facing={facing}
        ref={cameraRef}
        enableTorch={cameraTorch}
      >
      <Modal visible={stepPopup} transparent>
        <View style={styles.popupContainerStep}>
          <Text style={styles.popupText}>{steps[currentStep - 1]}</Text>
          <TouchableOpacity onPress={() => setStepPopup(false)}>
            <Text style={styles.popupButton}>OK</Text>
          </TouchableOpacity>
        </View>
      </Modal>

        <ProgressModal visible={progressModalVisible} onClose={() => setProgressModalVisible(false)} />
        <TiltIndicator />

        {/* {!sessionStarted && (
          <View style={styles.startSessionContainer}>
            <TouchableOpacity style={styles.startSessionButton} onPress={handleStartSession}>
              <Text style={styles.startSessionButtonText}>Start Session</Text>
            </TouchableOpacity>
          </View>
        )} */}


        <Image
          source={selectedBodyPart === 'arm' ? armImages[armCount] : bodyPartImages[selectedBodyPart]}
          style={styles.overlayImage}
          resizeMode="contain"
        />
        <View style={styles.bodyPartSelector}>
          {bodyParts.map((bodyPart) => (
            <TouchableOpacity
              key={bodyPart}
              style={[
                styles.bodyPartButton,
                selectedBodyPart === bodyPart && styles.selectedBodyPart,
              ]}
              onPress={() => handleBodyPartSelect(bodyPart)}
            >
              <Text style={styles.bodyPartText}>{bodyPart}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </CameraView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.swapFacing}
          onPress={toggleCameraFacing}
        >
          <Ionicons name="swap-horizontal" size={30} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleTakePicture}>
          <View style={styles.captureButtonOuter}>
            <View style={styles.captureButtonInner} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.torchButton}
          onPress={toggleCameraTorch}
        >
          <Ionicons name="flashlight" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
      <LightingAlert />
      <ImageCaptureSuccess />
    </View>
  );
}
