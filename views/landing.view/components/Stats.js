import React, { Component } from 'react';
import { connect } from "react-redux"

import { ResponsiveLine } from '@nivo/line'

import {
  getLogins
} from "../../store/modules/stats.module"

import {
  message
} from "../../store/modules/systemMessages.module"

const days = [0, 1, 2, 3, 4, 5, 6],
  dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
  getDayOfWeek = index => {
    index = index % 7;
    if (index < 0) index += 7;
    return days[index];
  },
  getDayName = index => {
    index = index % 7;
    if (index < 0) index += 7;
    return dayNames[index];
  };

const day = 1000.0 * 60.0 * 60.0 * 24.0,
  _7days = day * 7,
  _14days = day * 14,
  _21days = day * 21, 
  _28days = day * 28;

class Stats extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userSort: "_7days"
    }
  }
  componentDidMount() {
    this.props.getLogins();
  }
  setUserSort(userSort) {
    this.setState({ userSort });
  }
  processLogins() {
    const userData = {},
      weekData = [],
      today = new Date();
    today.setHours(12, 0, 0, 0);
    const todayDow = today.getDay(),
      now = today.valueOf(),
      { logins } = this.props.stats;

    for (let i = 0; i <= 7; ++i) {
      weekData.push({
        dow: todayDow - i,
        _7days: 0,
        _14days: 0,
        _21days: 0,
        _28days: 0
      })
    }

    logins.forEach(login => {
      const user = login.user_email,
        date = new Date(login.created_at);
      date.setHours(12, 0, 0, 0);
      const value = date.valueOf(),
        days = Math.floor((now - value) / day);
      if (!(user in userData)) {
        userData[user] = {
          _7days: 0,
          _14days: 0,
          _21days: 0,
          _28days: 0
        }
      }
      if (days <= 7) {
        userData[user]["_7days"] += 1;
      }
      if (days <= 14) {
        userData[user]["_14days"] += 1;
      }
      if (days <= 21) {
        userData[user]["_21days"] += 1;
      }
      if (days <= 28) {
        userData[user]["_28days"] += 1;
      }
      for (let i = 0; i <= 7; ++i) {
        const _dow = todayDow - i,//getDayOfWeek(todayDow - i),
          _now = now - day * i,
          _days = Math.floor((_now - value) / day);
        weekData[i].dow = _dow;
        if (_days < 0) continue;
        if (_days <= 7) {
          weekData[i]["_7days"] += 1;
        }
        if (_days <= 14) {
          weekData[i]["_14days"] += 1;
        }
        if (_days <= 21) {
          weekData[i]["_21days"] += 1;
        }
        if (_days <= 28) {
          weekData[i]["_28days"] += 1;
        }
      }
    }) // END logins.forEach
console.log(weekData)
    let lineData = [
      {
        id: "7 days",
        color: "rgb(255, 0, 0)",
        data: []
      },
      {
        id: "14 days",
        color: "rgb(0, 255, 0)",
        data: []
      },
      {
        id: "21 days",
        color: "rgb(0, 0, 255)",
        data: []
      },
      {
        id: "28 days",
        color: "rgb(0, 0, 0)",
        data: []
      }
    ]
    weekData.reverse().forEach(d => {
      lineData[0].data.push({
        x: d.dow,
        y: d._7days
      })
      lineData[1].data.push({
        x: d.dow,
        y: d._14days
      })
      lineData[2].data.push({
        x: d.dow,
        y: d._21days
      })
      lineData[3].data.push({
        x: d.dow,
        y: d._28days
      })
    })
    return { userData, lineData: logins.length ? lineData : [] };
  }
  render() {
    const {
      userData,
      lineData
    } = this.processLogins();
    const {
      userSort
    } = this.state;
    return (
      <div className="container">
        <h3>Stats</h3>
        <table className="table table-sm">
          <thead>
            <tr>
              <th>user</th>
              <th>
                <button className={ `btn btn-sm btn-${ userSort === "_7days" ? 'success' : 'primary' }` }
                  onClick={ () => this.setUserSort("_7days") }>
                  7 days
                </button>
              </th>
              <th>
                <button className={ `btn btn-sm btn-${ userSort === "_14days" ? 'success' : 'primary' }` }
                  onClick={ () => this.setUserSort("_14days") }>
                  14 days
                </button>
              </th>
              <th>
                <button className={ `btn btn-sm btn-${ userSort === "_21days" ? 'success' : 'primary' }` }
                  onClick={ () => this.setUserSort("_21days") }>
                  21 days
                </button>
              </th>
              <th>
                <button className={ `btn btn-sm btn-${ userSort === "_28days" ? 'success' : 'primary' }` }
                  onClick={ () => this.setUserSort("_28days") }>
                  28 days
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {
              Object.keys(userData)
                .sort((a, b) => userData[b][userSort] - userData[a][userSort])
                .map(user =>
                  <tr key={ user }>
                    <td>{ user }</td>
                    <td>{ userData[user]["_7days"] }</td>
                    <td>{ userData[user]["_14days"] }</td>
                    <td>{ userData[user]["_21days"] }</td>
                    <td>{ userData[user]["_28days"] }</td>
                  </tr>
                )
            }
          </tbody>
        </table>
        <div style={ { width: "100%", height: "400px" } }>
          <ResponsiveLine data={ lineData.slice() }
            stacked={ false }
            margin={ {
                "top": 50,
                "right": 100,
                "bottom": 50,
                "left": 75
            } }
            colors={ lineData.map(d => d.color) }
            xScale={ {
                "type": "point"
            } }
            yScale={ {
                "type": "linear",
                "stacked": false,
                "min": 0,
                "max": "auto"
            } }
            axisBottom={ {
                "orient": "bottom",
                "tickSize": 5,
                "tickPadding": 5,
                "tickRotation": 0,
                "legend": "weekday",
                "legendOffset": 36,
                "legendPosition": "center",
                "format": d => getDayName(d)
            } }
            axisLeft={ {
                "orient": "left",
                "tickSize": 5,
                "tickPadding": 5,
                "tickRotation": 0,
                "legend": "logins",
                "legendOffset": -50,
                "legendPosition": "center"
            } }
            dotSize={ 10 }
            dotColor="inherit"
            dotLabel="y"
            legends={ [
                {
                    "anchor": "bottom-right",
                    "direction": "column",
                    "justify": false,
                    "translateX": 100,
                    "translateY": 0,
                    "itemsSpacing": 0,
                    "itemDirection": "left-to-right",
                    "itemWidth": 80,
                    "itemHeight": 20,
                    "itemOpacity": 1,
                    "symbolSize": 12,
                    "symbolShape": "circle",
                    "symbolBorderColor": "rgba(0, 0, 0, .5)",
                    "effects": [
                        {
                            "on": "hover",
                            "style": {
                                "itemBackground": "rgba(0, 0, 0, .03)",
                                "itemOpacity": 1
                            }
                        }
                    ]
                }
            ] }/>
        </div>
      </div>
    )
  }
}

const mapStateToProps = state => ({
  user: state.user,
  stats: state.stats
})

const mapDispatchToProps = {
  getLogins,
  message
}

export default connect(mapStateToProps, mapDispatchToProps)(Stats);