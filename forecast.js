import _ from 'lodash';
export default function (success, error) {
  const myHeaders = new Headers();
  const requestConfig = { method: 'GET',
    headers: myHeaders,
    mode: 'cors',
    cache: 'default' };

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const {coords:{latitude, longitude}} = position;
      const request = new Request(`http://api.wunderground.com/api/fcb379ce904e70c0/forecast10day/q/${latitude},${longitude}.json`, requestConfig);

      fetch(request).then((response) => {
        if(response.ok) {
          response.json().then(success);
        } else {
          error('Forecast service response error');
        }
      }).catch(error);
    }
  )
}

export function predictTheBestTimeToWash (forecast) {

  //-10 C today tomorrow - then no
  //is it going to rain like a lot in next 7 days - then no
  //is it going to show - then no
  const {simpleforecast: {forecastday: days}} = forecast;

  const lowestTemperatureInTwoDays = _.chain(days).take(2).reduce((acc, day) => {
    const temperature = parseFloat(day.low.celsius);
    if (temperature < acc) {
      return temperature;
    } else {
      return acc;
    }
  }, 100).value();

  const rainyOrSnowyDays = _.chain(days).take(7).filter((day) => day.qpf_allday.mm > 0 || day.snow_allday.cm > 0).value();

  const isAnyRainOrSnowInNextWeek = rainyOrSnowyDays && rainyOrSnowyDays.length;

  return lowestTemperatureInTwoDays > -9 && !isAnyRainOrSnowInNextWeek;

}