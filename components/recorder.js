import React, {useEffect, useState} from 'react';
import {useSafeArea} from 'react-native-safe-area-context';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Colors, GlobalStyles} from '../styles';
import {Fitness} from '../lib';

export default function Recorder(props) {
  const safeAreaInsets = useSafeArea();
  const [pedometerData, setPedometerData] = useState(null);

  useEffect(() => {
    Fitness.startUpdates(pedometerData => setPedometerData(pedometerData));
    return () => Fitness.stopUpdates();
  });

  return (
    <View pointerEvents="box-none" style={[styles.container, props.style]}>
      { props.isRecording &&
        <>
          <View style={styles.header}>
            <Text style={[GlobalStyles.h2, styles.headerText]}>Recording</Text>
          </View>
          <View style={styles.body}>
            <View>
              <Text style={styles.count}>00.00</Text>
              <Text style={styles.label}>min</Text>
            </View>
            <View>
              <Text style={styles.count}>0.0</Text>
              <Text style={styles.label}>miles</Text>
            </View>
            <View>
              <Text style={styles.count}>{pedometerData ? pedometerData.numberOfSteps : 0}</Text>
              <Text style={styles.label}>steps</Text>
            </View>
          </View>
          <View style={[styles.buttonsContainer, {paddingBottom: safeAreaInsets.bottom}]}>
            <View style={styles.secondaryButtonContainer}>
            </View>
            <View style={styles.primaryButtonContainer}>
              <TouchableOpacity onPress={() => Fitness.stopRecording() }>
                <Image style={styles.primaryButton} source={require('../assets/stop.png')} />
              </TouchableOpacity>
              <Text style={[styles.buttonText, styles.recordText]}>Stop & Save</Text>
            </View>
            <View style={styles.secondaryButtonContainer}>
              <TouchableOpacity style={styles.primaryButton}>
                <Image style={styles.secondaryButton} source={require('../assets/pause.png')} />
              </TouchableOpacity>
              <Text style={[styles.buttonText, styles.pauseText]}>Pause</Text>
            </View>
          </View>
        </> }
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    padding: 16
  },
  header: {
    ...GlobalStyles.boxShadow,
    backgroundColor: Colors.primary.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
    height: 45,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10
  },
  headerText: {
    color: 'white',
    marginBottom: 0
  },
  body: {
    ...GlobalStyles.boxShadow,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: 'white',
    flex: 1,
    marginBottom: 20 + 17 + 8 + 27,
    justifyContent: 'center',
    alignItems: 'center'
  },
  count: {
    fontWeight: 'bold',
    fontSize: 72,
    lineHeight: 72,
    textAlign: 'center',
    color: Colors.primary.purple
  },
  label: {
    textAlign: 'center',
    fontSize: 18,
    color: Colors.primary.purple,
    marginBottom: 20
  },
  buttonsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 11
  },
  primaryButtonContainer: {
    alignItems: 'center',
    width: 120
  },
  primaryButton: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonText: {
    fontSize: 17,
    lineHeight: 17,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 20
  },
  secondaryButtonContainer: {
    alignItems: 'center',
    width: 80
  },
  secondaryButton: {
    width: 40,
    height: 40
  },
  pauseText: {
    color: Colors.accent.yellow
  },
  recordText: {
    color: Colors.secondary.red,
  }
});
