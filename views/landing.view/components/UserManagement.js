import React, { Component } from 'react';
import { connect } from "react-redux"

import TableContainer from "../../components/TableContainer.react"

import { message } from "../../store/modules/systemMessages.module"
import { getGroups } from "../../store/modules/groups.module"
import {
	deleteUser,
	getUsers,
	assign,
	remove,
	createFake
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
				<td className="info-group">{ this.props.email }</td>
				<td className="info-group">{ `${ joinDate.getMonth() + 1 }/${ joinDate.getDate() }/${ joinDate.getFullYear() }` }</td>
				<td className="group-1">
					<select value={ removeFrom } id="removeFrom"
						className="form-control form-control-sm"
						onChange={ this.onChange.bind(this) }>
						<option value="" hidden>Select a group...</option>
						{
							groups.map(g => <option key={ g } value={ g }>{ g }</option>)
						}
					</select>
				</td>
				<td className="group-1">
					<button onClick={ this.validateRemoveFrom.bind(this) }
						className="btn btn-sm btn-danger">
						remove
					</button>
				</td>
				<td className="group-2">
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
				<td className="group-2">
					<button onClick={ this.validateAssignTo.bind(this) }
						className="btn btn-sm btn-success">
						assign
					</button>
				</td>
				<td className="delete-group">
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
				<td className="info-group">{ user_email }</td>
				<td className="info-group">{ project_name }</td>
				<td className="info-group">{ new Date(resolved_at).toLocaleString() }</td>
				<td className="group-1">
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
				<td className="group-1">
					<button onClick={ this.validate.bind(this) }
						className="btn btn-sm btn-primary">
						accept
					</button>
				</td>
				<td className="delete-group">
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

	createFake() {
console.log(this.props.createFake)
		this.props.message(
			`Are you sure you wish to create a new fake user?`,
			{
				duration: 0,
				id: `create-fake`,
				onConfirm: () => this.props.createFake()
			}
		)
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
			deleteRequest,
			user
		} = this.props;

		const {
			groupFilter,
			projectFilter,
			searchFilter
		} = this.state;

		const unassignedUsers = users.filter(u => u.groups.length === 0)
			.filter(u => !groupFilter || u.groups.includes(groupFilter))
			.filter(u => !projectFilter || u.projects.reduce((a, c) => a || c.project_name === projectFilter, false))
    	.filter(u => u.email.toLowerCase().includes(searchFilter.toLowerCase()))
    	.sort((a, b) => new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf());

		const authLevelZeroUsers = users.filter(u => u.projects.reduce((a, c) => Math.max(a, c.auth_level), -1) === 0)
			.filter(u => !groupFilter || u.groups.includes(groupFilter))
			.filter(u => !projectFilter || u.projects.reduce((a, c) => a || c.project_name === projectFilter, false))
    	.filter(u => u.email.toLowerCase().includes(searchFilter.toLowerCase()))
    	.sort((a, b) => new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf());

		const filteredUsers = users
			.filter(u => !groupFilter || u.groups.includes(groupFilter))
			.filter(u => !projectFilter || u.projects.reduce((a, c) => a || c.project_name === projectFilter, false))
    	.filter(u => u.email.toLowerCase().includes(searchFilter.toLowerCase()))
    	.sort((a, b) => new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf());

		const rejectedRequests = requests.filter(r => r.state === "rejected");

 		const projects = groups.reduce((a, c) => [...new Set([...a, ...c.projects.map(p => p.project_name)])], []);

		return (
			<div className="container">
        <h3>User Management</h3>
        <table className="table table-sm">
          <thead>
          	<tr>
          		<th>Search Users</th>
          		<th>Group Filter</th>
							<th>Project Filter</th>
          	</tr>
          	<tr>
          		<td>
          			<input type="text" className="form-control form-control-sm"
          				placeholder="search user emails..." id="searchFilter"
									value={ searchFilter }
          				onChange={ this.onChange.bind(this) }/>
          		</td>
          		<td>
          			<select className="form-control form-control-sm"
          				onChange={ this.onChange.bind(this) } id="groupFilter"
									value={ groupFilter }>
          				<option value="">None</option>
          				{
          					groups.sort((a, b) => a.name < b.name ? -1 : 1)
          						.map(g => <option value={ g.name } key={ g.name }>{ g.name }</option>)
          				}
          			</select>
          		</td>
          		<td>
          			<select className="form-control form-control-sm"
          				onChange={ this.onChange.bind(this) } id="projectFilter"
									value={ projectFilter }>
          				<option value="">None</option>
          				{
          					projects.sort((a, b) => a.name < b.name ? -1 : 1)
          						.map(p => <option value={ p } key={ p }>{ p }</option>)
          				}
          			</select>
          		</td>
          	</tr>
          </thead>
        </table>
				{ !unassignedUsers.length ? null :
					<>
						<h3>Unassigned Users</h3>
		        <TableContainer
		        	headers={ ["email", "join date", "groups", "remove", "groups", "assign", "delete"] }
							categories={ [
								{ name: "Basic Info",
									className: "info-group",
									range: [0, 1]
								},
								{ name: "Remove from Group",
									className: "group-1",
									range: [2, 3]
								},
								{ name: "Assign to Group",
									className: "group-2",
									range: [4, 5]
								},
								{ name: "Delete User",
									className: "delete-group",
									range: [6, 6]
								}
							] }
		        	rows={
		        		unassignedUsers.map(u =>
			            <User key={ u.email } { ...u }
			            	allGroups={ groups }
			            	deleteUser={ deleteUser }
			            	message={ message }
			            	assign={ assign }
			            	remove={ remove }/>
			          )
				      }/>
					</>
				}
				{ !authLevelZeroUsers.length ? null :
					<>
						<h3>Auth Level Zero Users</h3>
		        <TableContainer
		        	headers={ ["email", "join date", "groups", "remove", "groups", "assign", "delete"] }
							categories={ [
								{ name: "Basic Info",
									className: "info-group",
									range: [0, 1]
								},
								{ name: "Remove from Group",
									className: "group-1",
									range: [2, 3]
								},
								{ name: "Assign to Group",
									className: "group-2",
									range: [4, 5]
								},
								{ name: "Delete User",
									className: "delete-group",
									range: [6, 6]
								}
							] }
		        	rows={
		        		authLevelZeroUsers.map(u =>
			            <User key={ u.email } { ...u }
			            	allGroups={ groups }
			            	deleteUser={ deleteUser }
			            	message={ message }
			            	assign={ assign }
			            	remove={ remove }/>
			          )
				      }/>
					</>
				}
	      <h3>All Users</h3>
        <TableContainer
        	headers={ ["email", "join date", "groups", "remove", "groups", "assign", "delete"] }
					categories={ [
						{ name: "Basic Info",
							className: "info-group",
							range: [0, 1]
						},
						{ name: "Remove from Group",
							className: "group-1",
							range: [2, 3]
						},
						{ name: "Assign to Group",
							className: "group-2",
							range: [4, 5]
						},
						{ name: "Delete User",
							className: "delete-group",
							range: [6, 6]
						}
					] }
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
				{ !user.groups.includes("AVAIL") ? null :
					<div style={ { marginBottom: "0.5rem" } }>
						<button className="btn btn-lg btn-primary"
							onClick={ e => this.createFake() }>
							<h3 style={ { margin: "0px" } }>Create Fake User</h3>
						</button>
					</div>
				}

				{ !rejectedRequests.length ? null :
					<>
		        <h3>Rejected Requests</h3>
		        <TableContainer
		        	headers={ ["email", "project", "date", "groups", "accept", "delete"] }
							categories={ [
								{ name: "Basic Info",
									className: "info-group",
									range: [0, 2]
								},
								{ name: "Add to Group",
									className: "group-1",
									range: [3, 4]
								},
								{ name: "Delete Request",
									className: "delete-group",
									range: [5, 5]
								}
							] }
		        	rows={
		            rejectedRequests
		              .map(r =>
		                <RejectedUser key={ r.user_email }
		                	request={ r }
		                	groups={ groups }
		                	accept={ accept }
		              		message={ message }
		              		deleteRequest={ deleteRequest }/>
		              )
				      }/>
					</>
				}

			</div>
		)
	}
}

const mapStateToProps = state => ({
	groups: state.groups,
	projects: state.projects,
	requests: state.requests,
	users: state.users,
	user: state.user
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
	deleteRequest,
	createFake
}

export default connect(mapStateToProps, mapDispatchToProps)(UserManagement);
