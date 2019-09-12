import React, { Component } from 'react';
import { connect } from "react-redux"

import { ResponsiveLine } from '@nivo/line'
import AvlGraph from "../../../AvlGraph"
import {
  AxisLeft,
  AxisBottom,
  LineGraph,
  Group
} from "../../../AvlGraph/components"

import {
  getLogins
} from "../../store/modules/stats.module"

import {
  message
} from "../../store/modules/systemMessages.module"

import { scaleLinear } from "d3-scale"

import TableContainer from "../../components/TableContainer.react"

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
      userSort: "_7days",
      projectFilter: ""
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

    const projects = {}

    logins.forEach(login => { projects[login.project_name] = true; })

    const { projectFilter } = this.state;

    const filtered = logins.filter(login => !projectFilter || (login.project_name === projectFilter));

    filtered.forEach(login => {
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
// console.log(weekData)
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
    return {
      userData,
      projects: Object.keys(projects),
      lineData: filtered.length ? lineData : []
    };
  }
  onChange(e) {
    this.setState({ [e.target.id]: e.target.value });
  }
  render() {
    const {
      userData,
      lineData,
      projects
    } = this.processLogins();
    const {
      userSort,
      projectFilter
    } = this.state;

    const colorScale = scaleLinear()
      .domain([1, lineData.length])
      .range(["#000", "#0f0"])

    return (
      <div className="container">
        <h3>Stats</h3>
        <div className="row">
          <div className="col-4"/>
          <div className="col-4">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>
                    Project Filter
                  </th>
                </tr>
                <tr>
                  <td>
                    <select onChange={ this.onChange.bind(this) }
                      value={ projectFilter } id="projectFilter"
                      className="form-control form-control-sm">
                      <option value="">No Project Filter</option>
                      {
                        projects.map(p => <option key={ p } value={ p }>{ p }</option>)
                      }
                    </select>
                  </td>
                </tr>
              </thead>
            </table>
          </div>
        </div>
        <div style={ { width: "100%", height: "400px", marginBottom: "20px" } }>
          <AvlGraph renderInteractiveLayer={ true }
            margin={ { left: 50 } }
            xFormat={ getDayName }
            yFormat={ y => `${ y } logins` }
            padding={ 0.25 }>

            <LineGraph data={ lineData.slice().reverse() }
              colors={ (d, i) => colorScale(i + 1) }
              plotPoints={ true }/>
            <AxisLeft label="Logins"/>
            <AxisBottom />

          </AvlGraph>
        </div>
        <TableContainer
          size={ 10 }
          headers={[
            "user",
            { label: "7 days",
              onClick: () => this.setUserSort("_7days"),
              color: userSort === "_7days" ? 'success' : 'primary' },
            { label: "14 days",
              onClick: () => this.setUserSort("_14days"),
              color: userSort === "_14days" ? 'success' : 'primary' },
            { label: "21 days",
              onClick: () => this.setUserSort("_21days"),
              color: userSort === "_21days" ? 'success' : 'primary' },
            { label: "28 days",
              onClick: () => this.setUserSort("_28days"),
              color: userSort === "_28days" ? 'success' : 'primary' }
          ]}
          rows={
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
        />
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
