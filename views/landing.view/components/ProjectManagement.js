import React, { Component } from 'react';
import { connect } from "react-redux"

import TableContainer from "../../components/TableContainer.react"

import { message } from "../../store/modules/systemMessages.module"
import {
	create,
	getProjects,
	deleteProject
} from "../../store/modules/projects.module"

class Project extends Component {
	deleteProject() {
		this.props.message(
			`Are you sure you wish to delete project "${ this.props.name }"?`,
			{
				duration: 0,
				id: `delete-project-${ this.props.name }`,
				onConfirm: () => this.props.deleteProject(this.props.name)
			}
		)
	}
	render() {
		const {
			name,
			created_at,
			created_by
		} = this.props;
		return (
			<tr>
				<td>{ name }</td>
				<td>{ created_by }</td>
				<td>{ new Date(created_at).toLocaleString() }</td>
				<td>
					<button onClick={ () => this.deleteProject() }
						className="btn btn-sm btn-danger">delete</button>
				</td>
			</tr>
		)
	}
}

class ProjectManagement extends Component {
	constructor(props) {
		super(props);
		this.state = {
			name: ""
		}
	}
	componentDidMount() {
		this.props.getProjects();
	}
	onChange(e) {
		this.setState({ [e.target.id]: e.target.value });
	}
	validate(e) {
		e.preventDefault();

		const errors = [];
		if (!this.state.name) {
			errors.push("Missing project name.");
		}
		errors.forEach(e => this.props.message(e));
		if (!errors.length) {
			this.create();
		}
	}
	create() {
		this.props.create(this.state.name);
		this.setState({ name: "" });
	}
	render() {
		return (
      <div className="container">
	  		<h1><b>Project Management</b></h1>
        <TableContainer
        	headers={ ["name", "created by", "created at", "delete"] }
        	rows={[
            this.props.projects
            	.sort((a, b) => new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf())
              .map(p =>
              	<Project key={ p.name } { ...p }
              		message={ this.props.message }
              		deleteProject={ this.props.deleteProject }/>
              )
        	]}/>
        <h3>Create A New Project</h3>
        <form onSubmit={ this.validate.bind(this) }>
        	<div className="form-group row">
        		<div className="col-4"/>
        		<div className="col-4">
		        	<input id="name" type="text"
		        		onChange={ this.onChange.bind(this) }
		        		placeholder="project name..."
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
		)
	}
}

const mapStateToProps = state => ({
	projects: state.projects
})

const mapDispatchToProps = {
	create,
  getProjects,
  message,
	deleteProject
}

export default connect(mapStateToProps, mapDispatchToProps)(ProjectManagement);
