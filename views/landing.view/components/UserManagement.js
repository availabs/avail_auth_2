import React, { Component } from 'react';
import { connect } from "react-redux"

import TableContainer from "../../components/TableContainer.react"

import { message } from "../../store/modules/systemMessages.module"
import { getGroups } from "../../store/modules/groups.module"
import {
	deleteUser,
	getUsers,
	assign,
	remove
} from "../../store/modules/users.module"
import {
	accept,
	getRequests,
	deleteRequest
} from "../../store/modules/requests.module"

class User extends Component {
	constructor(props) {
		super(props);
		this.state = {
			assignTo: "",
			removeFrom: ""
		}
	}
	onChange(e) {
		this.setState({ [e.target.id]: e.target.value });
	}
	validateAssignTo(e) {
		e.preventDefault();
		const errors = [];
		const { assignTo } = this.state;
		if (!assignTo) {
			errors.push("Missing required paramater: group.")
		}
		errors.forEach(e => this.props.message(e));
		if (!errors.length) {
			this.props.assign(this.props.email, assignTo);
			this.setState({ assignTo: "" });
		}
	}
	validateRemoveFrom(e) {
		e.preventDefault();
		const errors = [];
		const { removeFrom } = this.state;
		if (!removeFrom) {
			errors.push("Missing required paramater: group.")
		}
		errors.forEach(e => this.props.message(e));
		if (!errors.length) {
			this.props.remove(this.props.email, removeFrom);
			this.setState({ removeFrom: "" });
		}
	}
	deleteUser() {
		this.props.message(
			`Are you sure you wish to delete user "${ this.props.email }"?`,
			{
				duration: 0,
				id: `delete-user-${ this.props.email }`,
				onConfirm: () => this.props.deleteUser(this.props.email)
			}
		)
	}
	render() {
		const {
			email,
			created_at,
			groups,
			projects,
			allGroups
		} = this.props;
		const {
			assignTo,
			removeFrom
		} = this.state;
		const joinDate = new Date(created_at);
		return (
			<tr>
				<td>{ this.props.email }</td>
				<td>{ `${ joinDate.getMonth() + 1 }/${ joinDate.getDate() }/${ joinDate.getFullYear() }` }</td>
				<td>
					<select value={ removeFrom } id="removeFrom"
						className="form-control form-control-sm"
						onChange={ this.onChange.bind(this) }>
						<option value="" hidden>Select a group...</option>
						{
							groups.map(g => <option key={ g } value={ g }>{ g }</option>)
						}
					</select>
				</td>
				<td>
					<button onClick={ this.validateRemoveFrom.bind(this) }
						className="btn btn-sm btn-danger">
						remove
					</button>
				</td>
				<td>
					<select value={ assignTo } id="assignTo"
						className="form-control form-control-sm"
						onChange={ this.onChange.bind(this) }>
						<option value="" hidden>Select a group...</option>
						{
							allGroups.filter(g => !groups.includes(g.name))
								.map(g => <option key={ g.name }>{ g.name }</option>)
						}
					</select>
				</td>
				<td>
					<button onClick={ this.validateAssignTo.bind(this) }
						className="btn btn-sm btn-success">
						assign
					</button>
				</td>
				<td>
					<button onClick={ this.deleteUser.bind(this) }
						className="btn btn-sm btn-danger">
						delete
					</button>
				</td>
			</tr>
		)
	}
}

class RejectedUser extends Component {
	constructor(props) {
		super(props);
		this.state = {
			group: ""
		}
	}
	onChange(e) {
		this.setState({ [e.target.id]: e.target.value });
	}
	validate(e) {
		e.preventDefault();

		const errors = [],
			{ group } = this.state;
		if (!group) {
			errors.push("Missing required paramater: group.");
		}
		errors.forEach(e => this.props.message(e));
		if (!errors.length) {
			this.props.accept(this.props.request, group);
		}
	}
	deleteUser() {
		const {
			user_email,
			project_name
		} = this.props.request;
		this.props.message(
			`Are you sure you wish to delete this request?`,
			{
				duration: 0,
				id: `delete-request-${ user_email }-${ project_name }`,
				onConfirm: () => this.props.deleteRequest(this.props.request)
			}
		)
	}
	render() {
		const {
			user_email,
			project_name,
			resolved_at
		} = this.props.request;
		const {
			groups
		} = this.props;
		return (
			<tr>
				<td>{ user_email }</td>
				<td>{ project_name }</td>
				<td>{ new Date(resolved_at).toLocaleString() }</td>
				<td>
					<select value={ this.state.group } id="group"
						className="form-control form-control-sm"
						onChange={ this.onChange.bind(this) }>
						<option value="" hidden>Select a group...</option>
            {
              groups
              	.filter(g => g.projects.reduce((a, c) => a || (c.name === project_name), false))
                .map(({ name }) =>
                  <option key={ name } value={ name }>{ name }</option>
                )
            }
					</select>
				</td>
				<td>
					<button onClick={ this.validate.bind(this) }
						className="btn btn-sm btn-primary">
						accept
					</button>
				</td>
				<td>
					<button onClick={ this.deleteUser.bind(this) }
						className="btn btn-sm btn-danger">
						delete
					</button>
				</td>
			</tr>
		)
	}
}

class UserManagement extends Component {
	constructor(props) {
		super(props);
		this.state = {
			groupFilter: "",
			searchFilter: ""
		}
	}
	componentDidMount() {
		this.props.getGroups();
		this.props.getRequests();
		this.props.getUsers();
	}

	onChange(e) {
		this.setState({ [e.target.id]: e.target.value })
	}

	render() {
		const {
			groups,
			requests,
			users,
			deleteUser,
			message,
			accept,
			assign,
			remove,
			deleteRequest
		} = this.props;
		const {
			groupFilter,
			searchFilter
		} = this.state;
		const filteredUsers = users
			.filter(u => !groupFilter || u.groups.includes(groupFilter))
    	.filter(u => u.email.toLowerCase().includes(searchFilter.toLowerCase()))
    	.sort((a, b) => new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf());
		return (
			<div className="container">
        <h3>User Management</h3>
        <table className="table table-sm">
          <thead>
          	<tr>
          		<th>Search Users</th>
          		<th>Group Filter</th>
          	</tr>
          	<tr>
          		<td>
          			<input type="text" className="form-control form-control-sm"
          				placeholder="search user emails..." id="searchFilter"
          				onChange={ this.onChange.bind(this) }/>
          		</td>
          		<td>
          			<select className="form-control form-control-sm"
          				onChange={ this.onChange.bind(this) } id="groupFilter">
          				<option value="">None</option>
          				{
          					groups.sort((a, b) => a.name < b.name ? -1 : 1)
          						.map(g => <option value={ g.name } key={ g.name }>{ g.name }</option>)
          				}
          			</select>
          		</td>
          	</tr>
          </thead>
        </table>
        <TableContainer
        	headers={ ["email", "join date", "groups", "remove", "groups", "assign", "delete"] }
        	rows={
        		filteredUsers.map(u =>
	            <User key={ u.email } { ...u }
	            	allGroups={ groups }
	            	deleteUser={ deleteUser }
	            	message={ message }
	            	assign={ assign }
	            	remove={ remove }/>
	          )
		      }/>
        <h3>Rejected Requests</h3>
        <TableContainer
        	headers={ ["email", "project", "date", "groups", "accept", "delete"] }
        	rows={
            requests.filter(r => r.state === "rejected")
              .map(r =>
                <RejectedUser key={ r.user_email }
                	request={ r }
                	groups={ groups }
                	accept={ accept }
              		message={ message }
              		deleteRequest={ deleteRequest }/>
              )
		      }/>

			</div>
		)
	}
}

const mapStateToProps = state => ({
	groups: state.groups,
	projects: state.projects,
	requests: state.requests,
	users: state.users
})

const mapDispatchToProps = {
	accept,
	deleteUser,
	getGroups,
	getRequests,
  getUsers,
  message,
	assign,
	remove,
	deleteRequest
}

export default connect(mapStateToProps, mapDispatchToProps)(UserManagement);