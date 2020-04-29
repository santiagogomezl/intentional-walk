'use strict'

import Realm from 'realm';
import 'react-native-get-random-values';
import {v4 as uuidv4} from 'uuid';
import moment from 'moment';
import Api from './api';
import Strings from './strings';

class AppUser {

};

AppUser.schema = {
  name: 'AppUser',
  primaryKey: 'id',
  properties: {
    id: 'string',
    name: 'string',
    email: 'string',
    zip: 'string',
    age: 'int',
  }
};

class Contest {
  get isBeforeStartDate() {
    return moment().startOf('day').isBefore(this.start);
  }

  /// returns a plain JS object representation to avoid Realm update conflicts
  toObject() {
    return {
      id: this.id,
      start: moment(this.start).toISOString(),
      end: moment(this.end).toISOString(),
      isBeforeStartDate: this.isBeforeStartDate
    };
  }
};

Contest.schema = {
  name: 'Contest',
  primaryKey: 'id',
  properties: {
    id: 'string',
    start: 'date',
    end: 'date'
  }
}

class IntentionalWalk {
  get timeOfWalk() {
    const start = moment(this.start);
    const noon = moment(start).startOf('day').add(12, 'h');
    if (start.isBefore(noon)) {
      return Strings.common.morningWalk;
    }
    const evening = moment(noon).add(6, 'h');
    if (start.isBefore(evening)) {
      return Strings.common.afternoonWalk;
    }
    return Strings.common.eveningWalk;
  }

  get elapsedTime() {
    if (this.start && this.end) {
      let dt = moment(this.end).diff(this.start, 'seconds');
      if (this.pause) {
        dt -= this.pause;
      }
      return dt;
    }
    return 0;
  }
};

IntentionalWalk.schema = {
  name: 'IntentionalWalk',
  primaryKey: 'id',
  properties: {
    id: 'string',
    start: 'date',
    end: 'date?',
    pause: 'int',
    steps: 'int',
    distance: 'double',
  }
}

class Settings {

}

Settings.schema = {
  name: 'Settings',
  primaryKey: 'id',
  properties: {
    id: 'int',
    accountId: 'string',
    lang: 'string?',
  }
}

function open() {
  return Realm.open({
    schema: [AppUser, Contest, IntentionalWalk, Settings],
    deleteRealmIfMigrationNeeded: true // TODO: remove after schema stabilizes
  });
};

function write(callback) {
  return open().then(realm => {
    realm.write(() => callback(realm));
  });
}

function getContest() {
  return open().then(realm => {
      const contests = realm.objects('Contest');
      return contests.length > 0 ? contests[0] : null;
    });
}

function updateContest() {
  return Api.contest.current()
    .then(response => {
      if (response.data.status == 'success') {
        let contest = null;
        return write(realm => {
            realm.delete(realm.objects('Contest'));
            contest = realm.create('Contest', {
              id: response.data.payload.contest_id,
              start: moment(response.data.payload.start).startOf('day').toDate(),
              end: moment(response.data.payload.end).endOf('day').toDate()
            });
          }).then(() => contest);
      } else {
        throw "Could not fetch current contest";
      }
    });
}

function getSettings() {
  return open().then(realm => {
    let settings = realm.objectForPrimaryKey('Settings', 0);
    if (!settings) {
      realm.write(() => {
        settings = realm.create('Settings', {
          id: 0,
          accountId: uuidv4(),
        });
      });
    }
    return settings;
  });
}

function createUser(id, name, email, zip, age) {
  let user = null;
  return write(realm => {
      user = realm.create('AppUser', {
        id, name, email, zip,
        age: parseInt(age)
      });
    }).then(() => user);
}

function getUser() {
  return open().then(realm => {
      const users = realm.objects('AppUser');
      return users.length > 0 ? users[0] : null;
    });
}

function destroyUser() {
  return write(realm => {
      realm.delete(realm.objects('AppUser'));
      realm.delete(realm.objects('IntentionalWalk'));
      realm.delete(realm.objects('Settings'));
    });
}

function startWalk() {
  return getCurrentWalk().then(walk => {
      if (!walk) {
        return write(realm => {
            walk = realm.create('IntentionalWalk', {
              id: uuidv4(),
              start: new Date(),
              pause: 0,
              steps: 0,
              distance: 0
            });
          }).then(() => walk);
      } else {
        return walk;
      }
    });
}

function getCurrentWalk() {
  return open().then(realm => {
      const results = realm.objects('IntentionalWalk').filtered('end=null');
      return results.length > 0 ? results[0] : false;
    });
}

function updateCurrentWalk(data) {
  return getCurrentWalk().then(walk => {
      return write(realm => {
          if (data) {
            if (data.numberOfSteps && data.numberOfSteps > 0) {
              walk.steps = data.numberOfSteps;
            }
            if (data.distance && data.distance > 0) {
              walk.distance = data.distance;
            }
          }
        }).then(() => walk);
    });
}

function stopWalk(end, data) {
  getCurrentWalk().then(walk => {
    if (walk) {
      return open().then(realm => {
          return realm.write(() => {
            walk.end = end;
            walk.steps = data ? (data.numberOfSteps || 0) : 0;
            walk.distance = data ? (data.distance || 0) : 0;
          });
        })
        .then(() => getUser())
        .then(user => Api.intentionalWalk.create([
            {
              event_id: walk.id,
              start: walk.start,
              end: walk.end,
              steps: walk.steps,
              distance: walk.distance,
              pause_time: walk.pause,
            }
          ], user.id));
    }
  });
}

function getWalks() {
  return open()
    .then(realm => realm.objects('IntentionalWalk').sorted([['end', true]]));
}

function syncWalks() {
  return getUser()
    .then(user => {
      if (user) {
        return Api.intentionalWalk.get(user.id)
          .then(response => {
            if (response && response.data && response.data.intentional_walks) {
              return open().then(realm => {
                const ids = []
                realm.write(() => {
                  for (let data of response.data.intentional_walks) {
                    ids.push(data.event_id);
                    realm.create('IntentionalWalk', {
                      id: data.event_id,
                      start: moment(data.start).toDate(),
                      end: moment(data.end).toDate(),
                      steps: data.steps,
                      distance: data.distance,
                      pause: data.pause_time,
                    }, 'modified');
                  }
                });
                /// search for any objects that are locally saved but (for some reason) not on server
                if (ids.length > 0) {
                  const results = realm.objects('IntentionalWalk').filtered(ids.map(id => `id <> "${id}"`).join(' AND '));
                  if (results.length > 0) {
                    const intentionalWalks = [];
                    for (let intentionalWalk of results) {
                      intentionalWalks.push({
                        event_id: intentionalWalk.id,
                        start: intentionalWalk.start,
                        end: intentionalWalk.end,
                        steps: intentionalWalk.steps,
                        distance: intentionalWalk.distance,
                        pause_time: intentionalWalk.pause,
                      });
                    }
                    return Api.intentionalWalk.create(intentionalWalks, user.id);
                  }
                }
              });
            }
          });
      }
    });
}

export default {
  open,
  write,
  getContest,
  updateContest,
  getSettings,
  createUser,
  getUser,
  destroyUser,
  startWalk,
  getCurrentWalk,
  updateCurrentWalk,
  stopWalk,
  getWalks,
  syncWalks,
};
