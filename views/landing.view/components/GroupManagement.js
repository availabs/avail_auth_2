import React, { Component } from 'react';
import { connect } from "react-redux"

import TableContainer from "../../components/TableContainer.react"

import { message } from "../../store/modules/systemMessages.module"
import {
	deleteGroup,
	assignToProject,
	create,
	getGroups,
	removeFromProject,
	adjustAuthLevel
} from "../../store/modules/groups.module"
import { getProjects } from "../../store/modules/projects.module"

class Group extends Component {
	constructor(props) {
		super(props);
		this.state = {
			removeFrom: "",
			assignTo: "",
			adjust: "",
			adjusted_auth_level: -1,
			auth_level: -1
		}
	}
	onChange(e) {
		let value = e.target.value;
		if (e.target.id.includes("auth_level")) {
			value = Math.max(-1, Math.min(+value, this.props.authLevel));
		}
		this.setState({ [e.target.id]: value })
	}
	validateAssign(e) {
		e.preventDefault();

		const errors = [];
		const {
			assignTo,
			auth_level
		} = this.state;
		if (!assignTo) {
			errors.push("You must select a project.")
		}
		if (auth_level < 0) {
			errors.push("You must assign an authority level.")
		}
		errors.forEach(e => this.props.message(e));
		if (!errors.length) {
			this.props.assignToProject(this.props.name, assignTo, auth_level);
			this.setState({ assignTo: "", auth_level: -1 });
		}
	}
	validateRemove(e) {
		e.preventDefault();

		const errors = [];
		const {
			removeFrom
		} = this.state;
		if (!removeFrom) {
			errors.push("You must select a project.")
		}
		errors.forEach(e => this.props.message(e));
		if (!errors.length) {
			this.props.removeFromProject(this.props.name, removeFrom);
			this.setState({ removeFrom: "" });
		}
	}
	validateAdjust(e) {
		e.preventDefault();

		const errors = [];
		const {
			adjust,
			adjusted_auth_level
		} = this.state;
		if (!adjust) {
			errors.push("You must select a project.")
		}
		if (adjusted_auth_level < 0) {
			errors.push("You must assign an authority level.")
		}
		errors.forEach(e => this.props.message(e));
		if (!errors.length) {
			this.props.adjustAuthLevel(this.props.name, adjust, adjusted_auth_level);
			this.setState({ adjust: "", adjusted_auth_level: -1 });
		}
	}
	deleteGroup() {
		this.props.message(
			`Are you sure you wish to delete group "${ this.props.name }"?`,
			{
				duration: 0,
				onConfirm: () => this.props.deleteGroup(this.props.name)
			}
		)
	}
	render() {
		const {
			name,
			meta,
			created_at,
			created_by,
			projects,
			allProjects,
			authLevel,
			num_members
		} = this.props;
		const {
			removeFrom,
			assignTo,
			auth_level,
			adjust,
			adjusted_auth_level
		} = this.state;
		return (
			<tr>
				<td className="info-group">{ name }</td>
				<td className="info-group">{ created_by }</td>
				<td className="info-group">{ new Date(created_at).toLocaleString() }</td>
				<td className="info-group">{ num_members }</td>
				<td className="group-1">
					<select value={ adjust } id="adjust"
						className="form-control form-control-sm"
						onChange={ this.onChange.bind(this) }>
						<option value="" hidden>select a project...</option>
						{
							projects.map(p =>
								<option key={ p.project_name } value={ p.project_name }>({ p.auth_level }) { p.project_name }</option>
							)
						}
					</select>
				</td>
				<td className="group-1">
					<input type="number" min={ 0 } max={ authLevel }
						className="form-control form-control-sm"
						id="adjusted_auth_level" value={ adjusted_auth_level }
						onChange={ this.onChange.bind(this) }/>
				</td>
				<td className="group-1">
					<button onClick={ this.validateAdjust.bind(this) }
						className="btn btn-sm btn-primary">
						adjust
					</button>
				</td>

				<td className="group-2">
					<select value={ assignTo } id="assignTo"
						onChange={ this.onChange.bind(this) }
						className="form-control form-control-sm">
						<option value="" hidden>select a project...</option>
						{
							allProjects
								.filter(p => projects.reduce((a, c) => a && (c.project_name !== p.name), true))
								.map(p => <option key={ p.name } value={ p.name }>{ p.name }</option>)
						}
					</select>
				</td>
				<td className="group-2">
					<input type="number" min={ 0 } max={ authLevel }
						className="form-control form-control-sm"
						id="auth_level" value={ auth_level }
						onChange={ this.onChange.bind(this) }/>
				</td>
				<td className="group-2">
					<button onClick={ this.validateAssign.bind(this) }
						className="btn btn-sm btn-primary">assign</button>
				</td>

				<td className="group-3">
					<select value={ removeFrom } id="removeFrom"
						className="form-control form-control-sm"
						onChange={ this.onChange.bind(this) }>
						<option value="" hidden>select a project...</option>
						{
							projects.map(p =>
								<option key={ p.project_name } value={ p.project_name }>({ p.auth_level }) { p.project_name }</option>
							)
						}
					</select>
				</td>
				<td className="group-3">
					<button onClick={ this.validateRemove.bind(this) }
						className="btn btn-sm btn-danger">remove</button>
				</td>

				<td className="delete-group">
					<button onClick={ this.deleteGroup.bind(this) }
						className="btn btn-sm btn-danger">delete</button>
				</td>
			</tr>
		)
	}
}

class GroupManagement extends Component {
	constructor(props) {
		super(props);
		this.state = {
			name: "",
			searchFilter: "",
			projectFilter: ""
		}
	}
	componentDidMount() {
		this.props.getGroups();
		this.props.getProjects();
	}
	onChange(e) {
		this.setState({ [e.target.id]: e.target.value });
	}
	validate(e) {
		e.preventDefault();

		const errors = [];
		if (!this.state.name) {
			errors.push("Missing required parameter: name.");
		}
		errors.forEach(e => this.props.message(e));
		if (!errors.length) {
			this.props.create(this.state.name);
			this.setState({ name: "" })
		}
	}
	render() {
		const { groups = [], projects = [] } = this.props;
		const {
			searchFilter,
			projectFilter
		} = this.state;

		const unassignedGroups = groups.filter(g => !g.projects.length)
			.filter(g => g.name.toLowerCase().includes(searchFilter.toLowerCase()))
			.filter(g => !projectFilter || g.projects.reduce((a, c) => a || c.project_name === projectFilter, false));
		return (
			<div>
				<div className="container">
		      <h1><b>Group Management</b></h1>
	        <table className="table table-sm">
	          <thead>
	          	<tr>
	          		<th colSpan={ 3 }>
	          			Search Groups
	          		</th>
	          		<th colSpan={ 3 }>
	          			Project Filter
	          		</th>
	          	</tr>
	          	<tr>
	          		<td colSpan={ 3 }>
	          			<input type="text" placeholder="search group names..."
	          				className="form-control form-control-sm"
	          				id="searchFilter" value={ searchFilter }
	          				onChange={ this.onChange.bind(this) }/>
	          		</td>
	          		<td colSpan={ 3 }>
	          			<select className="form-control form-control-sm"
	          				onChange={ this.onChange.bind(this) } id="projectFilter">
	          				<option value="">None</option>
	          				{
	          					projects.sort((a, b) => a.name < b.name ? -1 : 1)
	          						.map(g => <option value={ g.name } key={ g.name }>{ g.name }</option>)
	          				}
	          			</select>
	          		</td>
	          	</tr>
	          </thead>
	        </table>
			  </div>
				{ !unassignedGroups.length ? null :
	      	<div className="container-fluid">
						<h3>Unassigned Groups</h3>
						<TableContainer
		        	headers={ [
		            "name",
		            "created by",
		            "created at",
								"members",
		            "projects",
		            "authority",
		            "adjust",
		            "projects",
		            "authority",
		            "assign",
		            "projects",
		            "remove",
		            "delete"
		        	] }
							categories={ [
								{ name: "Basic Info",
									className: "info-group",
									range: [0, 3]
								},
								{ name: "Adjust Project Authority",
									className: "group-1",
									range: [4, 6]
								},
								{ name: "Assign to New Project",
									className: "group-2",
									range: [7, 9]
								},
								{ name: "Remove from Project",
									className: "group-3",
									range: [10, 11]
								},
								{ name: "Delete Group",
									className: "delete-group",
									range: [12, 12]
								}
							] }
		        	rows={
		            unassignedGroups
		            	.sort((a, b) => new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf())
		              .map(g =>
		                <Group key={ g.name } { ...g }
		                	authLevel={ this.props.user.authLevel }
		                	message={ this.props.message }
		                	allProjects={ projects }
		                	assignToProject={ this.props.assignToProject }
		                	removeFromProject={ this.props.removeFromProject }
		                	deleteGroup={ this.props.deleteGroup }
		                	adjustAuthLevel={ this.props.adjustAuthLevel }/>
		              )
		        	}/>
					</div>
				}
				<h3>All Groups</h3>
	      <div className="container-fluid">
	        <TableContainer
	        	headers={ [
	            "name",
	            "created by",
	            "created at",
							"members",
	            "projects",
	            "authority",
	            "adjust",
	            "projects",
	            "authority",
	            "assign",
	            "projects",
	            "remove",
	            "delete"
	        	] }
						categories={ [
							{ name: "Basic Info",
								className: "info-group",
								range: [0, 3]
							},
							{ name: "Adjust Project Authority",
								className: "group-1",
								range: [4, 6]
							},
							{ name: "Assign to New Project",
								className: "group-2",
								range: [7, 9]
							},
							{ name: "Remove from Project",
								className: "group-3",
								range: [10, 11]
							},
							{ name: "Delete Group",
								className: "delete-group",
								range: [12, 12]
							}
						] }
	        	rows={
	            groups
								.filter(g => !unassignedGroups.includes(g))
	            	.filter(g => g.name.toLowerCase().includes(searchFilter.toLowerCase()))
	            	.filter(g => !projectFilter || g.projects.reduce((a, c) => a || c.project_name === projectFilter, false))
	            	.sort((a, b) => new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf())
	              .map(g =>
	                <Group key={ g.name } { ...g }
	                	authLevel={ this.props.user.authLevel }
	                	message={ this.props.message }
	                	allProjects={ projects }
	                	assignToProject={ this.props.assignToProject }
	                	removeFromProject={ this.props.removeFromProject }
	                	deleteGroup={ this.props.deleteGroup }
	                	adjustAuthLevel={ this.props.adjustAuthLevel }/>
	              )
	        	}/>
				</div>
				<div className="container">
	        <h3>Create A New Group</h3>
	        <form onSubmit={ this.validate.bind(this) }>
	        	<div className="form-group row">
	        		<div className="col-4"/>
	        		<div className="col-4">
			        	<input id="name" type="text"
			        		onChange={ this.onChange.bind(this) }
			        		placeholder="group name..."
			        		className="form-control form-control-sm"
			        		value={ this.state.name }/>
			        </div>
		        </div>
	        	<div>
		        	<input type="submit" value="create"
		        		className="btn btn-sm btn-primary"/>
		        </div>
	        </form>
				</div>
			</div>
		)
	}
}

const mapStateToProps = state => ({
	groups: state.groups,
	projects: state.projects,
	user: state.user
})

const mapDispatchToProps = {
	assignToProject,
	create,
	deleteGroup,
  getGroups,
  getProjects,
  message,
	removeFromProject,
	adjustAuthLevel
}

export default connect(mapStateToProps, mapDispatchToProps)(GroupManagement);
