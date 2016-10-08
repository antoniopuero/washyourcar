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
  AsyncStorage
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
      isItTheBestTimeToWash: null
    };

    this.setBackgroundTimer();
  }

  componentWillMount () {
    this.refreshState();
  }

  setBackgroundTimer () {
    if (this.refreshTimeout) {
      BackgroundTimer.clearTimeout(this.refreshTimeout);
    }

    let timeoutHours = 24;
    if (moment().format("HH") > 21) {
      timeoutHours = 12;
    }

    this.refreshTimeout = BackgroundTimer.setTimeout(this.refreshState.bind(this), timeoutHours * 60 * 60 * 1000);
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

    if (needToPredict || true) {
      getForecast((response) => {
        console.log(response);
        const isItTheBestTimeToWash = predictTheBestTimeToWash(response.forecast);
        this.setState({
          isItTheBestTimeToWash
        });
        if (isItTheBestTimeToWash) {
          this.pushNotification();
        }
      }, (error) => {
        PushNotification.localNotification({
          title: 'Wash your car',
          message: "Try a bit later please, we experience some problems. Or contact us if it's getting weird"
        });
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
      nextUpdateInDays: 7
    })
  }

  render () {
    return (
      <View style={styles.container}>
        {this.state.isItTheBestTimeToWash ?
          <Text style={styles.welcome}>
            It's the best time to wash your car today or tomorrow. The temperature is good enough and it's not gonna
            rain or snow in the next week.
          </Text> : <View>
          {this.state.needToPredict ? <Button
            containerStyle={{padding: 10, height: 45, overflow: 'hidden', borderRadius: 4, backgroundColor: 'white'}}
            style={{fontSize: 20, color: 'green'}}
            onPress={() => this.saveWashDate()}>
            I washed my car recently
          </Button> :
            <Text style={styles.welcome}>
              You washed your car recently. The next washing is going to be like
              in {this.state.nextUpdateInDays} {this.state.nextUpdateInDays > 1 ? 'days' : 'day'};
            </Text>}
        </View>}

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
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  }
});

AppRegistry.registerComponent('washyourcar', () => washyourcar);
