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
import { passwordForce, createNewUser } from "../../store/modules/user.module"
import {
	accept,
	getRequests,
	deleteRequest
} from "../../store/modules/requests.module"
import { getProjects } from "../../store/modules/projects.module"

class User extends Component {
	constructor(props) {
		super(props);
		this.state = {
			assignTo: "",
			removeFrom: "",
			forcedPassword: ""
		}
		this.onChange = this.onChange.bind(this);
		this.validateAssignTo = this.validateAssignTo.bind(this);
		this.validateRemoveFrom = this.validateRemoveFrom.bind(this);
		this.deleteUser = this.deleteUser.bind(this);
		this.forcePassword = this.forcePassword.bind(this);
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
	forcePassword() {
		this.props.message(
			`Are you sure you want to set the password for user "${ this.props.email }" to "${ this.state.forcedPassword }"?`,
			{
				duration: 0,
				id: `password-force-${ this.props.email }`,
				onConfirm: () => this.props.force(this.props.email, this.state.forcedPassword)
			}
		)
	}
	render() {
		const {
			email,
			created_at,
			groups,
			projects,
			allGroups,
			user,
			force
		} = this.props;

		const {
			assignTo,
			removeFrom
		} = this.state;

		const joinDate = new Date(created_at);
		const userAuthLevel = user.authLevel;

		return (
			<tr>
				<td className="info-group">{ this.props.email }</td>
				<td className="info-group">{ `${ joinDate.getMonth() + 1 }/${ joinDate.getDate() }/${ joinDate.getFullYear() }` }</td>
				<td className="group-1">
					<select value={ removeFrom } id="removeFrom"
						className="form-control form-control-sm"
						onChange={ this.onChange }>
						<option value="" hidden>Select a group...</option>
						{
							groups.map(g => <option key={ g } value={ g }>{ g }</option>)
						}
					</select>
				</td>
				<td className="group-1">
					<button onClick={ this.validateRemoveFrom }
						className="btn btn-sm btn-danger">
						remove
					</button>
				</td>
				<td className="group-2">
					<select value={ assignTo } id="assignTo"
						className="form-control form-control-sm"
						onChange={ this.onChange }>
						<option value="" hidden>Select a group...</option>
						{
							allGroups.filter(g => !groups.includes(g.name))
								.map(g => <option key={ g.name }>{ g.name }</option>)
						}
					</select>
				</td>
				<td className="group-2">
					<button onClick={ this.validateAssignTo }
						className="btn btn-sm btn-success">
						assign
					</button>
				</td>
				<td className="group-3">
					<input id="forcedPassword"
						className="form-control form-control-sm"
						value={ this.state.forcedPassword }
						onChange={ this.onChange }
						disabled={ userAuthLevel < 10 }/>
				</td>
				<td className="group-3">
					<button className="btn btn-sm btn-success"
						onClick={ this.forcePassword }
						disabled={ userAuthLevel < 10 && !this.state.forcedPassword }>
						set
					</button>
				</td>
				<td className="delete-group">
					<button onClick={ this.deleteUser }
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
            { groups
              	.filter(g => g.projects.reduce((a, c) => a || (c.project_name === project_name), false))
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

const UserHeaders = [
	"email",
	"join date",
	"groups",
	"remove",
	"groups",
	"assign",
	"password",
	"set",
	"delete"
]
const UserCategories = [
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
	{ name: "Set Password",
		className: "group-3",
		range: [6, 7]
	},
	{ name: "Delete User",
		className: "delete-group",
		range: [8, 8]
	}
]

class UserManagement extends Component {
	constructor(props) {
		super(props);
		this.state = {
			groupFilter: "",
			searchFilter: "",

			isOpen: false,

			newUserEmail: "",
			newUserEmailVerify: "",
			newUserPassword: "",
			newUserPasswordVerify: "",
			newUserProject: "",
			newUserGroup: ""
		}

		this.toggleOpen = this.toggleOpen.bind(this);
	}
	toggleOpen() {
		this.setState(prev => ({ isOpen: !prev.isOpen }));
	}
	componentDidMount() {
		this.props.getGroups();
		this.props.getRequests();
		this.props.getUsers();
		this.props.getProjects();
	}

	onChange(e) {
		this.setState({ [e.target.id]: e.target.value })
		if (e.target.id === "newUserProject") {
			this.setState({ newUserGroup: "" });
		}
	}

	createFake() {
		this.props.message(
			`Are you sure you wish to create a new fake user?`,
			{
				duration: 0,
				id: `create-fake`,
				onConfirm: () => this.props.createFake()
			}
		)
	}

	createNewUser(e) {
    e.preventDefault();
		const {
			newUserEmail: email,
			newUserPassword: password,
			newUserProject: project,
			newUserGroup: group
		} = this.state;
		this.props.createNewUser(email, password, project, group);
		this.setState({
			newUserEmail: "",
			newUserEmailVerify: "",
			newUserPassword: "",
			newUserPasswordVerify: "",
			newUserProject: "",
			newUserGroup: ""
		})
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
			user,
			passwordForce
		} = this.props;

		const {
			groupFilter,
			projectFilter,
			searchFilter,

			newUserEmail,
			newUserEmailVerify,
			newUserPassword,
			newUserPasswordVerify,
			newUserProject,
			newUserGroup
		} = this.state;

		const newUserDisabled = !newUserEmail ||
														(newUserEmail !== newUserEmailVerify) ||
														!newUserPassword ||
														(newUserPassword !== newUserPasswordVerify) ||
														!newUserProject ||
														!newUserGroup;

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

		const newUserGroups = groups.filter(g => {
			return g.projects.reduce((a, c) => { return a || c.project_name === newUserProject; }, false)
		})

		return (
			<div className="container-fluid">
        <h1><b>User Management</b></h1>

				{ this.props.user.authLevel < 10 ? null :
					<div className="container">
						<h3 onClick={ this.toggleOpen } style={ { cursor: "pointer" } }>
							<span className={ `fa ${ this.state.isOpen ? "fa-minus" : "fa-plus" } mr-2` }/>
							Create New User
						</h3>
						{ !this.state.isOpen ? null :
			        <form onSubmit={ this.createNewUser.bind(this) }>

			          <div className="form-group row">
			            <div className="col-2"/>
			            <label htmlFor="newUserEmail" style={ { textAlign: "left" } }
			              className="col-3 col-form-label">New User Email</label>
			            <div className="col-5">
			              <input type="email" id="newUserEmail"
			                onChange={ this.onChange.bind(this) }
			                placeholder="enter new user email"
			                className="form-control form-control-sm"
			                value={ newUserEmail }/>
			            </div>
			          </div>

			          <div className="form-group row">
			            <div className="col-2"/>
			            <label htmlFor="newUserEmailVerify" style={ { textAlign: "left" } }
			              className="col-3 col-form-label">Verify New User Email</label>
			            <div className="col-5">
			              <input type="email" id="newUserEmailVerify"
			                onChange={ this.onChange.bind(this) }
			                placeholder="verify new user email"
			                className="form-control form-control-sm"
			                value={ newUserEmailVerify }/>
			            </div>
			          </div>

			          <div className="form-group row">
			            <div className="col-2"/>
			            <label htmlFor="newUserPassword" style={ { textAlign: "left" } }
			              className="col-3 col-form-label">New User Password</label>
			            <div className="col-5">
			              <input type="text" id="newUserPassword"
			                onChange={ this.onChange.bind(this) }
			                placeholder="enter new user password"
			                className="form-control form-control-sm"
			                value={ newUserPassword }/>
			            </div>
			          </div>

			          <div className="form-group row">
			            <div className="col-2"/>
			            <label htmlFor="newUserPasswordVerify" style={ { textAlign: "left" } }
			              className="col-3 col-form-label">Verify New User Password</label>
			            <div className="col-5">
			              <input type="text" id="newUserPasswordVerify"
			                onChange={ this.onChange.bind(this) }
			                placeholder="verify new user password"
			                className="form-control form-control-sm"
			                value={ newUserPasswordVerify }/>
			            </div>
			          </div>

			          <div className="form-group row">
			            <div className="col-2"/>
			            <label htmlFor="newUserProject" style={ { textAlign: "left" } }
			              className="col-3 col-form-label">New User Project</label>
			            <div className="col-5">
			              <select id="newUserProject"
			                onChange={ this.onChange.bind(this) }
			                className="form-control form-control-sm"
			                value={ newUserProject }
										>
											<option value="" hidden>Select a project...</option>
											{ projects.map(p => (
													<option key={ p } value={ p }>{ p }</option>
												))
											}
										</select>
			            </div>
			          </div>

			          <div className="form-group row">
			            <div className="col-2"/>
			            <label htmlFor="newUserGroup" style={ { textAlign: "left" } }
			              className="col-3 col-form-label">New User Group</label>
			            <div className="col-5">
			              <select id="newUserGroup"
			                onChange={ this.onChange.bind(this) }
			                className="form-control form-control-sm"
			                value={ newUserGroup }
										>
											<option value="" hidden>{ newUserProject ? 'Select a group...' : "Select a project first..." }</option>
											{ newUserGroups.map(g => (
													<option key={ g.name } value={ g.name }>{ g.name }</option>
												))
											}
										</select>
			            </div>
			          </div>

			          <div style={ { padding: "0 15rem" } }>
			            <button className="btn btn-sm btn-primary btn-block"
			              type="submit" value="submit"
										disabled={ newUserDisabled }
									>
										create new user
									</button>
			          </div>

							</form>
						}
					</div>
				}

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
					<div style={ { marginTop: "0.5rem" } }>
						<h3>Unassigned Users</h3>
		        <TableContainer
		        	headers={ UserHeaders }
							categories={ UserCategories }
		        	rows={
		        		unassignedUsers.map(u =>
			            <User key={ u.email } { ...u }
			            	allGroups={ groups }
			            	deleteUser={ deleteUser }
			            	message={ message }
			            	assign={ assign }
			            	remove={ remove }
										force={ passwordForce }
										user={ user }/>
			          )
				      }/>
					</div>
				}
				{ !authLevelZeroUsers.length ? null :
					<div style={ { marginTop: "0.5rem" } }>
						<h3>Auth Level Zero Users</h3>
		        <TableContainer
		        	headers={ UserHeaders }
							categories={ UserCategories }
		        	rows={
		        		authLevelZeroUsers.map(u =>
			            <User key={ u.email } { ...u }
			            	allGroups={ groups }
			            	deleteUser={ deleteUser }
			            	message={ message }
			            	assign={ assign }
			            	remove={ remove }
										force={ passwordForce }
										user={ user }/>
			          )
				      }/>
					</div>
				}
				<div style={ { marginTop: "0.5rem" } }>
		      <h3>All Users</h3>
	        <TableContainer
						headers={ UserHeaders }
						categories={ UserCategories }
	        	rows={
	        		filteredUsers.map(u =>
		            <User key={ u.email } { ...u }
		            	allGroups={ groups }
		            	deleteUser={ deleteUser }
		            	message={ message }
		            	assign={ assign }
		            	remove={ remove }
									force={ passwordForce }
									user={ user }/>
		          )
			      }/>
				</div>

				{ !rejectedRequests.length ? null :
					<div style={ { marginTop: "0.5rem" } }>
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
					</div>
				}

				{ !user.groups.includes("AVAIL") ? null :
					<div style={ { margin: "0.5rem 0rem" } }>
						<button className="btn btn-lg btn-primary"
							onClick={ e => this.createFake() }>
							<h3 style={ { margin: "0px" } }>Create Fake User</h3>
						</button>
					</div>
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
	createFake,
	passwordForce,
	getProjects,
	createNewUser
}

export default connect(mapStateToProps, mapDispatchToProps)(UserManagement);
