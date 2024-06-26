import React, { Component } from 'react';
import { connect } from "react-redux"

import TableContainer from "../../components/TableContainer.react"

import MarkdownRenderer from 'react-markdown-renderer';

import {
  getMessages,
  viewMessages,
  deleteMessages,
  postMessage
} from "../../store/modules/messages.module"

import {
  message
} from "../../store/modules/systemMessages.module"

import {
	getUsers
} from "../../store/modules/users.module"
import {
	getGroups
} from "../../store/modules/groups.module"
import {
	getProjects
} from "../../store/modules/projects.module"

import Overlay from "./Overlay"

const ComposeMessage = ({
												heading,
												message,
												type,
                        project,
												target,
												users,
												groups,
												projects,
												onChange,
                        filterGroup
											}) => (
	<div>
		<div className="row">
			<div className="col-6">
				<h3>Compose Message</h3>
				<div className="form-group">
					<input type="text" placeholder="enter heading..."
						className="form-control form-control-sm"
						onChange={ onChange }
						value={ heading } id="heading"/>
				</div>
				<div className="form-group">
					<textarea placeholder="enter message..."
						className="form-control form-control-sm"
						onChange={ onChange }
						value={ message } id="message"/>
				</div>
			</div>
			<div className="col-6">
				<h3>Preview Message</h3>
				<div className="form-group" style={ { textAlign: "left" } }>
					<h5>{ heading }</h5>
				</div>
				<div className="form-group" style={ { textAlign: "left" } }>
					<MarkdownRenderer markdown={ message }
						options={ { html: true } }/>
				</div>
			</div>
		</div>

		<div className="row">
			<div className="col-6">
				<h3>Message Type</h3>
				<select onChange={ onChange }
					className="form-control form-control-sm"
					id="type" value={ type }>
					<option value="" hidden>select a type...</option>
					<option value="user">user</option>
					<option value="group">group</option>
					<option value="project">project</option>
					<option value="all">all</option>
				</select>

        { !["user", "group"].includes(type) ? null :
          <div style={ { marginTop: "5px" } }>
            <h3>Project</h3>
            <select onChange={ onChange }
              className="form-control form-control-sm"
              value={ project } id="project">
              <option value="" hidden>select a project...</option>
              {
                projects.sort((a, b) => a.name < b.name ? -1 : 1)
                  .map((u, i) =>
                    <option key={ u.name } value={ u.name }>{ u.name }</option>
                  )
              }
            </select>
          </div>
        }

        { type !== "user" || !project ? null :
          <div style={ { marginTop: "5px" } }>
            <h3>Group</h3>
            <select onChange={ onChange }
              className="form-control form-control-sm"
              value={ project } id="filterGroup">
              <option value="" hidden>select a group...</option>
              {
                groups.filter(({ projects }) => {
                    return projects.reduce((a, c) => {
                      return a || c.project_name === project;
                    }, false);
                  })
                  .sort((a, b) => a.name < b.name ? -1 : 1)
                  .map((u, i) =>
                    <option key={ u.name } value={ u.name }>{ u.name }</option>
                  )
              }
            </select>
          </div>
        }
			</div>
			{ type === "all" ? null :
				<div className="col-6">
					<h3>Message Target</h3>
					{ type === "user" && project ?
							<select onChange={ onChange }
								className="form-control form-control-sm"
								value={ target } id="target">
								<option value="" hidden>select a user...</option>
								{
									users.filter(({ projects }) => {
                      return projects.reduce((a, c) => {
                        return a || c.project_name === project;
                      }, false);
                    })
                    .filter(({ groups }) => {
                      return !filterGroup || groups.includes(filterGroup);
                    })
                    .sort((a, b) => a.email < b.email ? -1 : 1)
										.map((u, i) =>
											<option key={ u.email } value={ u.email }>{ u.email }</option>
										)
								}
							</select> :
						type === "group" && project ?
							<select onChange={ onChange }
								className="form-control form-control-sm"
								value={ target } id="target">
								<option value="" hidden>select a group...</option>
								{
									groups.filter(({ projects }) => {
                      return projects.reduce((a, c) => {
                        return a || c.project_name === project;
                      }, false);
                    })
                    .sort((a, b) => a.name < b.name ? -1 : 1)
										.map((u, i) =>
											<option key={ u.name } value={ u.name }>{ u.name }</option>
										)
								}
							</select> :
						type === "project" ?
							<select onChange={ onChange }
								className="form-control form-control-sm"
								value={ target } id="target">
								<option value="" hidden>select a project...</option>
								{
									projects.sort((a, b) => a.name < b.name ? -1 : 1)
										.map((u, i) =>
											<option key={ u.name } value={ u.name }>{ u.name }</option>
										)
								}
							</select> :
						null
					}
				</div>
			}
		</div>

	</div>
)

class Message extends Component {
	delete(e) {
		e.stopPropagation();
		this.props.sendMessage(
			'Are you sure you want to delete this message?',
			{
				duration: 0,
				onConfirm: () => this.props.delete(this.props.id),
				type: 'danger'
			}
		)
	}
	render() {
		const {
			message,
			heading,
			sent_at,
			sent_by,
			viewed,
			opened,
			toggle
		} = this.props;
		return (
			<tr onClick={ toggle }>
				<td>
					<div className={ `message${ viewed ? ' viewed' : '' }` }>
						<div>
							<span style={ { paddingRight: "20px" } }>{ sent_by }</span>
							<span style={ { paddingRight: "20px" } }><b>{ heading }</b></span>
							<span>{ new Date(sent_at).toLocaleString() }</span>
						</div>
						{ !opened ? null :
							<div style={ { paddingTop: "8px" } }>
								<MarkdownRenderer markdown={ message }
									options={ { html: true } }/>
								<div className="clearfix">
									<button className="btn btn-sm btn-danger float-right"
										onClick={ this.delete.bind(this) }>
										delete
									</button>
								</div>
							</div>
						}
					</div>
				</td>
			</tr>
		)
	}
}

class Home extends Component {
	constructor(props) {
		super(props);
		this.state = {
			overlay: "hide",

			heading: "",
			message: "",

			type: "",
      project: "",
			target: "",

      filterGroup: "",

			openMessage: -1
		}
	}
	toggleOpenMessage(i, id) {
		let openMessage = -1;
		if (i !== this.state.openMessage) {
			openMessage = i;
			this.props.viewMessages(id);
		}
		this.setState({ openMessage });
	}
	componentDidMount() {
		this.props.getMessages();
		this.props.getUsers();
		this.props.getGroups();
		this.props.getProjects();
	}
	dismissOverlay() {
		this.setState({ overlay: "hide" });
	}
	showOverlay() {
		this.setState({ overlay: "show" });
	}
	onChange(e) {
		let { target } = this.state;
		if (e.target.id === "type") {
			target = "";
		}
		this.setState({ target, [e.target.id]: e.target.value });
	}
	valdiateMessage() {
		const {
			heading,
			message,
			type,
      project,
			target
		} = this.state;
		const errors = [];
		if (!heading) {
			errors.push("Missing required parameter: heading.");
		}
		if (!message) {
			errors.push("Missing required parameter: message.");
		}
		if (!type) {
			errors.push("Missing required parameter: type.");
		}
		if ((type !== "all") && !project) {
			errors.push("Missing required parameter: project.");
		}
		if ((type !== "all") && !target) {
			errors.push("Missing required parameter: target.");
		}
		errors.forEach(e => this.props.message(e));
		if (!errors.length) {
			this.props.postMessage(heading, message, type, target, project);
			this.setState({ heading: "", message: "", type: "", project: "", target: "", filterGroup: "" });
		}
	}
  render() {
  	const {
  		openMessage
  	} = this.state;

  	const {
  		messages,
  		users,
  		groups,
  		projects
  	} = this.props;

    return (
      <div className='container'>
        <div style={ { position: "relative" } }>
  		    <h1><b>Welcome</b></h1>
        	<button className="btn btn-sm btn-success"
        		onClick={ e => this.showOverlay() }
        		style={ { position: "absolute", top: "4px", right: "13px" } }>
        	 	compose message
        	</button>
        </div>
        <TableContainer
        	rows={
        		messages
        			.sort((a, b) => new Date(b.sent_at).valueOf() - new Date(a.sent_at).valueOf())
        			.map((m, i) =>
        				<Message key={ m.id } { ...m }
        					view={ this.props.viewMessages }
        					sendMessage={ this.props.message }
        					delete={ this.props.deleteMessages }
        					toggle={ this.toggleOpenMessage.bind(this, i, m.id) }
        					opened={ openMessage === i }/>
        			)
        		}/>
        <Overlay state={ this.state.overlay }
        	dismiss={ () => this.dismissOverlay() }
        	acceptLabel="Send Message"
        	accept={ () => this.valdiateMessage() }>
        	<ComposeMessage { ...this.state }
        		onChange={ this.onChange.bind(this) }
        		users={ users }
        		groups={ groups }
        		projects={ projects }/>
        </Overlay>
      </div>
    )
  }
}

const mapStateToProps = state => ({
  user: state.user,
  messages: state.messages,
	users: state.users,
	groups: state.groups,
	projects: state.projects
})

const mapDispatchToProps = {
  getMessages,
  message,
  viewMessages,
  deleteMessages,
  postMessage,
  getUsers,
  getGroups,
  getProjects
}

export default connect(mapStateToProps, mapDispatchToProps)(Home);
