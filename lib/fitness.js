'use strict'

import Fitness from '@ovalmoney/react-native-fitness';
import moment from 'moment';

/// on android, the interval dates are not on day boundaries, so normalize
function normalize(records) {
  const normalizedRecords = []
  let day = null;
  for (let record of records) {
    if (day == null || !(moment(record.startDate).isSameOrAfter(day.startDate) && moment(record.endDate).isBefore(day.endDate))) {
      let startDate = moment(record.startDate).startOf('day');
      let endDate = moment(startDate).add(1, 'days');
      day = {startDate, endDate, quantity: record.quantity};
      normalizedRecords.push(day);
    } else {
      day.quantity += record.quantity;
    }
  }
  return normalizedRecords;
}

function getSteps(from, to) {
  return new Promise((resolve, reject) => {
    Fitness.isAuthorized().then((authorized) => {
      if (authorized) {
        Fitness.getSteps({
          startDate: from.toISOString(),
          endDate: to.toISOString(),
          interval: 'days'
        }).then(steps => {
          resolve(normalize(steps));
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
        }).then(distances => {
          resolve(normalize(distances));
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

function getStepsAndDistances(from, to) {
  return Promise.all([
    getSteps(from, to),
    getDistance(from, to)
  ]).then(([steps, distances]) => {
    /// combine steps and distances into a single payload as expected by API
    const dailyWalks = [];
    for (let [i, step] of steps.entries()) {
      const dailyWalk = {
        date: step.startDate.format('YYYY-MM-DD'),
        steps: step.quantity
      };
      if (i < distances.length && distances[i].startDate.isSame(step.startDate)) {
        dailyWalk.distance = distances[i].quantity;
      } else {
        /// not sure if this will ever happen, but just in case steps/distances array don't match
        for (let distance of distances) {
          if (distance.startDate.isSame(step.startDate)) {
            dailyWalk.distance = distance.quantity;
            break;
          }
        }
      }
      dailyWalks.push(dailyWalk);
    }
    return dailyWalks;
  });
}

export default {
  getDistance,
  getSteps,
  getStepsAndDistances,
};
