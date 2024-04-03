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

class PendingRequestItem extends Component {
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

const AwaitingRequestItem = ({ request, ...props }) => {
  const {
    user_email,
    project_name,
    created_at
  } = request;
  return (
    <tr>
      <td>{ user_email }</td>
      <td>{ project_name }</td>
      <td>{ new Date(created_at).toLocaleString() }</td>
    </tr>
  )
}

class PendingRequests extends Component {
  state = {
    searchFilter: ""
  }
  setSearch(e) {
    this.setState({ searchFilter: e.target.value })
  }
  componentDidMount() {
    this.props.getGroups();
    this.props.getRequests();
  }
  render() {
    const {
      groups,
      requests
    } = this.props;
    const [pending, awaiting] = requests.reduce((a, c) => {
      if (c.state === "pending") {
        a[0].push(c)
      }
      else if (c.state === "awaiting") {
        a[1].push(c);
      }
      return a;
    }, [[], []]);

    const { searchFilter } = this.state;
    const toLower = searchFilter.toLowerCase();

    return (
      <div className="container">
        <h1><b>Request Management</b></h1>

        <table className="table table-sm">
          <thead>
            <tr>
              <th>
                Search Requests
              </th>
            </tr>
            <tr>
              <td colSpan={ 3 }>
                <input type="text" placeholder="search group names..."
                  className="form-control form-control-sm"
                  id="searchFilter" value={ this.state.searchFilter }
                  onChange={ this.setSearch.bind(this) }/>
              </td>
            </tr>
          </thead>
        </table>

  		  <h3>Pending Requests</h3>
        <TableContainer
          headers={ ["request email", "project name", "request date", "group", "actions"] }
          rows={
            pending.filter(r => !toLower || r.user_email.toLowerCase().includes(toLower))
              .map((r, i) =>
                <PendingRequestItem key={ i } request={ r }
                  accept={ this.props.accept }
                  reject={ this.props.reject }
                  groups={ groups }
                  user={ this.props.user }
                  message={ this.props.message }/>
              )
          }/>
      		<h3>Awaiting Requests</h3>
          <TableContainer
            headers={ ["request email", "project name", "request date"] }
            rows={
              awaiting.filter(r => !toLower || r.user_email.toLowerCase().includes(toLower))
                .map((r, i) =>
                  <AwaitingRequestItem key={ i } request={ r }
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
