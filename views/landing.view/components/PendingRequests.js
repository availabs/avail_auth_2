import React, { Component } from 'react';
import { connect } from "react-redux"

import TableContainer from "../../components/TableContainer.react"

import {
  getRequests,
  accept,
  reject
} from "../../store/modules/requests.module"

import {
  getGroups
} from "../../store/modules/groups.module"

import {
  message
} from "../../store/modules/systemMessages.module"

class RequestItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      group: ""
    }
  }
  setGroup(e) {
    this.setState({ group: e.target.value });
  }
  accept() {
    if (this.state.group && this.props.user.token) {
      this.props.accept(this.props.request, this.state.group)
    }
    else if (!this.state.group) {
      this.props.message("You must select a group before accepting a request.")
    }
  }
  reject() {
    if (this.props.user.token) {
      this.props.reject(this.props.request);
    }
  }
  render() {
    const {
      user_email,
      project_name,
      created_at
    } = this.props.request;
console.log("GROUPS:", this.props.groups);
    return (
      <tr>
        <td>{ user_email }</td>
        <td>{ project_name }</td>
        <td>{ new Date(created_at).toLocaleString() }</td>
        <td>
          <select onChange={ this.setGroup.bind(this) } value={ this.state.group }
            className="form-control form-control-sm">
            <option hidden value="">Select a group...</option>
            {
              this.props.groups
                .filter(g => g.projects.reduce((a, c) => a || (c.project_name === project_name), false))
                .sort((a, b) => a.name < b.name ? -1 : 1)
                .map(({ name }) =>
                  <option key={ name } value={ name }>{ name }</option>
                )
            }
          </select>
        </td>
        <td>
          <button onClick={ this.accept.bind(this) }
            style={ { marginRight: "8px" } }
            className="btn btn-sm btn-primary">
            Accept
          </button>
          <button onClick={ this.reject.bind(this) }
            className="btn btn-sm btn-danger">
            Reject
          </button>
        </td>
      </tr>
    )
  }
}

class PendingRequests extends Component {
  componentDidMount() {
    this.props.getGroups();
    this.props.getRequests();
  }
  render() {
    const {
      groups,
      requests
    } = this.props;
    const pending = requests.filter(r => r.state === "pending");
    return (
      <div className="container">
        <h3>Pending Requests</h3>
        <TableContainer
          headers={ ["request email", "project name", "request date", "group", "actions"] }
          rows={
            pending.map((r, i) =>
              <RequestItem key={ i } request={ r }
                accept={ this.props.accept }
                reject={ this.props.reject }
                groups={ groups }
                user={ this.props.user }
                message={ this.props.message }/>
            )
          }/>
      </div>
    )
  }
}

const mapStateToProps = state => ({
  user: state.user,
  groups: state.groups,
  requests: state.requests
})

const mapDispatchToProps = {
  getGroups,
  getRequests,
  accept,
  reject,
  message
}

export default connect(mapStateToProps, mapDispatchToProps)(PendingRequests);
