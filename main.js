/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, {Component} from 'react';

import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  AsyncStorage,
  AppState
} from 'react-native';

import Button from 'react-native-button';
import BackgroundTimer from 'react-native-background-timer';
import PushNotification from 'react-native-push-notification';

PushNotification.configure({
  onNotification: function (notification) {
    console.log('NOTIFICATION:', notification);
  }
});

import moment from 'moment';

import getForecast, {predictTheBestTimeToWash} from './forecast';

class washyourcar extends Component {

  constructor (props) {
    super(props);
    this.state = {
      needToPredict: true,
      forecast: 'nothing',
      lastWashingDate: null,
      nextUpdateInDays: 7,
      isItTheBestTimeToWash: null,
      error: null,
      currentAppState: AppState.currentState
    };

    this.setBackgroundTimer();
  }

  componentDidMount () {
    AppState.addEventListener('change', this._handleAppStateChange.bind(this));
  }

  componentWillUnmount () {
    AppState.removeEventListener('change', this._handleAppStateChange.bind(this));
  }

  _handleAppStateChange (currentAppState) {
    this.setState({currentAppState});
  }

  async componentWillMount () {
    this.refreshState();
  }

  setBackgroundTimer () {
    if (this.refreshTimeout) {
      BackgroundTimer.clearTimeout(this.refreshTimeout);
    }

    const timeout = moment().add(1, 'days').hours(17).minutes(0).diff(moment());

    this.refreshTimeout = BackgroundTimer.setTimeout(this.refreshState.bind(this), timeout);
  }

  async refreshState () {
    const lastWashingDate = await AsyncStorage.getItem('lastWashingDate');
    const oneWeekLater = moment(lastWashingDate, 'lll').add(1, 'weeks');
    let needToPredict = false;

    if (!lastWashingDate || moment().isSameOrAfter(oneWeekLater)) {
      needToPredict = true;
    }
    this.setState({
      needToPredict,
      lastWashingDate,
      nextUpdateInDays: oneWeekLater.diff(moment(), 'days')
    });

    if (needToPredict) {
      getForecast((response) => {
        const isItTheBestTimeToWash = predictTheBestTimeToWash(response.forecast);
        this.setState({
          isItTheBestTimeToWash
        });

        if (isItTheBestTimeToWash && this.state.currentAppState != 'active') {
          this.pushNotification();
        }
      }, (error) => {
        this.setState({error});
        BackgroundTimer.setTimeout(() => this.setState({error: null}), 8000);
      });
    }
  }

  pushNotification () {
    PushNotification.localNotification({
      title: 'Wash your car',
      message: 'It\'s the best time to wash your car today or tomorrow'
    });
  }

  saveWashDate () {
    const lastWashingDate = moment().format('lll');
    AsyncStorage.setItem('lastWashingDate', lastWashingDate);
    this.setState({
      needToPredict: false,
      isItTheBestTimeToWash: null,
      lastWashingDate,
      nextUpdateInDays: 6
    })
  }

  render () {
    return (
      <View style={styles.container}>
        {this.state.error && <View>
          {this.state.error}
        </View>}
        {this.state.needToPredict ?
          <View>
            {this.state.isItTheBestTimeToWash ?
              <Text style={styles.welcome}>
                It's the best time to wash your car today or tomorrow. The temperature is good enough and it's not gonna
                rain or snow in the next week.
              </Text> :
              <Text style={styles.welcome}>
                It's not the best time to wash your car today.
              </Text>}
            <Button
              containerStyle={styles.buttonContainer}
              style={styles.button}
              onPress={() => this.saveWashDate()}>
              I washed my car recently
            </Button>
          </View> :
          <View>
            <Text style={styles.welcome}>
              You washed your car recently. The next washing is going to be like
              in {this.state.nextUpdateInDays} {this.state.nextUpdateInDays > 1 ? 'days' : 'day'};
            </Text>
          </View>
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  error: {
    backgroundColor: '#ff3634',
    color: '#fff'
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  button: {
    fontSize: 20,
    color: 'white'
  },
  buttonContainer: {
    padding: 10,
    height: 45,
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: '#10a700'
  }
});

AppRegistry.registerComponent('washyourcar', () => washyourcar);