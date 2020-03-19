'use strict'

import React from 'react';
import Fitness from '@ovalmoney/react-native-fitness';
import Pedometer from '@t2tx/react-native-universal-pedometer';
import moment from 'moment';
import Realm from './realm';

function getSteps(from, to) {
  return new Promise((resolve, reject) => {
    Fitness.isAuthorized().then((authorized) => {
      if (authorized) {
        Fitness.getSteps({
          startDate: from.toISOString(),
          endDate: to.toISOString(),
          interval: 'days'
        }).then(steps => {
          resolve(steps);
        }).catch(error => {
          reject({code: 'unexpected', error});
        });
      } else {
        reject({code: 'unauthorized'});
      }
    }).catch(error => {
      reject({code: 'unexpected'});
    });
  });
}

function getDistance(from, to) {
  return new Promise((resolve, reject) => {
    Fitness.isAuthorized().then((authorized) => {
      if (authorized) {
        Fitness.getDistance({
          startDate: from.toISOString(),
          endDate: to.toISOString(),
          interval: 'days'
        }).then(steps => {
          resolve(steps);
        }).catch(error => {
          reject({code: 'unexpected'});
        });
      } else {
        reject({code: 'unauthorized'});
      }
    }).catch(error => {
      reject({code: 'unexpected', error});
    });
  });
}

function getDailySteps(date) {
  const from = date;
  const to = moment(date).add(1, 'days');
  return getSteps(from, to).then(steps => {
    for (let step of steps) {
      if (moment(step.startDate).isSameOrAfter(from) && moment(step.endDate).isSameOrBefore(to)) {
        return step;
      }
    }
    return {quantity: 0};
  });
}

function getTotalSteps(from, to) {
  return getSteps(from, to).then(steps => {
    const result = {quantity: 0};
    for (let step of steps) {
      if (moment(step.startDate).isSameOrAfter(from) && moment(step.endDate).isSameOrBefore(to)) {
        result.quantity += step.quantity;
      }
    }
    return result;
  });
}

function getDailyDistance(date) {
  const from = date;
  const to = moment(date).add(1, 'days');
  return getDistance(from, to).then(distances => {
    for (let distance of distances) {
      if (moment(distance.startDate).isSameOrAfter(from) && moment(distance.endDate).isSameOrBefore(to)) {
        return distance;
      }
    }
    return {quantity: 0};
  });
}

function getCurrentWalk() {
  return new Promise((resolve, reject) => {
    Realm.open().then(realm => {
      const results = realm.objects('IntentionalWalk').filtered('end=null');
      resolve(results.length > 0 ? results[0] : false);
    });
  });
}

function startRecording() {
  return new Promise((resolve, reject) => {
    getCurrentWalk().then(walk => {
      if (!walk) {
        Realm.open().then(realm => {
          realm.write(() => {
            const walk = realm.create('IntentionalWalk', {
              start: new Date()
            });
            resolve(walk)
          });
        }).catch(error => {
          reject(error);
        });
      } else {
        resolve(walk);
      }
    });
  });
}

function startUpdates(callback) {
  getCurrentWalk().then(walk => {
    if (walk) {
      Pedometer.startPedometerUpdatesFromDate(walk.start.getTime(), callback);
    }
  });
}

function stopUpdates() {
  Pedometer.stopPedometerUpdates();
}

function stopRecording() {
  return new Promise((resolve, reject) => {
    getCurrentWalk().then(walk => {
      if (walk) {
        const end = new Date();
        Pedometer.queryPedometerDataBetweenDates(walk.start.getTime(), end.getTime(), (error, data) => {
          if (error) {
            reject(error);
          } else {
            Realm.open().then(realm => {
              realm.write(() => {
                walk.end = end;
                walk.steps = data.numberOfSteps ? data.numberOfSteps : 0;
                walk.distance = data.distance ? data.distance : 0;
                resolve(walk);
              });
            }).catch(error => {
              reject(error);
            });
          }
        });
      }
    });
  });
}

export default {
  getDailySteps,
  getDailyDistance,
  getTotalSteps,
  getCurrentWalk,
  startRecording,
  startUpdates,
  stopUpdates,
  stopRecording,
};
