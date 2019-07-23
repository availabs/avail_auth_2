import React, { Component } from 'react';
import { connect } from "react-redux"

import App from "../App"

import GroupManagement from "./components/GroupManagement"
import Home from "./components/Home"
import Login from "./components/Login"
import PendingRequests from "./components/PendingRequests"
import ProjectManagement from "./components/ProjectManagement"
import Stats from "./components/Stats"
import Update from "./components/Update"
import UserManagement from "./components/UserManagement"

import { message } from "../store/modules/systemMessages.module"
import { logout } from "../store/modules/user.module"

import { getRequests } from "../store/modules/requests.module"

import { getMessages } from "../store/modules/messages.module"

import '../styles/main.css';

class LandingView extends Component {
  constructor(props) {
    super(props)
    this.state = {
      view: "home",
      interval: null
    }
    if (localStorage && localStorage.getItem("landing-state")) {
      this.state = JSON.parse(localStorage.getItem("landing-state"));
    }
  }
  componentDidMount() {
    this.props.getMessages();
    this.props.getRequests();
  }
  componentWillUnmount() {
    if (this.state.interval) {
      clearInterval(this.state.interval);
    }
  }
  componentDidUpdate(oldProps, oldState) {
    if (!oldProps.user.authed && this.props.user.authed) {
      const interval = setInterval(
        () => { this.props.getMessages(); this.props.getRequests(); }
        , 15000
      )
      this.setState({ interval });
    }
    else if (oldProps.user.authed && !this.props.user.authed) {
      clearInterval(this.state.interval);
      this.setState({ interval: null });
    }
  }

  setView(view) {
    this.setState({ view });
    if (localStorage) {
      localStorage.setItem("landing-state", JSON.stringify({ view }));
    }
  }
  getView() {
    switch (this.state.view) {
      case "home":
        return <Home />;
      case "pending":
        return <PendingRequests />;
      case "update":
        return <Update />;
      case "groups":
        return <GroupManagement />;
      case "projects":
        return <ProjectManagement />;
      case "users":
        return <UserManagement />;
      case "stats":
        return <Stats />
    }
  }
  createHeaderNav() {
    const { authed, authLevel } = this.props.user,
      headerItems = [];

    if (authed) {
      headerItems.push({
        onClick: () => this.setView("home"),
        label: "home",
        key: 'home',
        alert: this.props.messages.filter(m => !m.viewed).length
      })
    }
    if (authed && (authLevel > 0)) {
      headerItems.push(
        { onClick: () => this.setView("pending"),
          label: "pending requests",
          key: 'pending',
          alert: this.props.requests.filter(r => r.state === "pending").length },
        { onClick: () => this.setView("users"),
          label: "user management",
          key: 'users' },
        { onClick: () => this.setView("groups"),
          label: "group management",
          key: 'groups' }
      )
    }
    if (authed && (authLevel === 10)) {
      headerItems.push({
        onClick: () => this.setView("projects"),
        label: "project management",
        key: 'projects'
      })
    }
    if (authed && (authLevel > 0)) {
      headerItems.push({
        onClick: () => this.setView("stats"),
        label: 'stats',
        key: 'stats'
      })
    }
    if (authed) {
      headerItems.push(
        { onClick: () => this.setView("update"),
          label: "update password",
          key: 'update'
        },
        { onClick: () => {
            this.props.message(
              'Are you sure you wish to logout?',
              {
                duration: 0,
                onConfirm: this.props.logout,
                id: 'logout'
              }
            )
          },
          label: "logout",
          key: 'logout',
          color: 'danger'
        }
      )
    }

    return headerItems;
  }
	render() {
console.log("USER:", this.props.user);
		const { authed, authLevel } = this.props.user,
      links = authed ? [] :
      [
        { href: "/signup", label: "signup" },
        { href: "/reset", label: "forgot password" }
      ];
  	return (
      <App headerItems={ this.createHeaderNav() }
        current={ this.state.view }
        links={ links }>
        { authed ? this.getView() :
          <Login />
        }
      </App>
  	);
	}
}

const mapStateToProps = state => ({
	user: state.user,
  requests: state.requests,
  messages: state.messages
})

const mapDispatchToProps = {
	logout,
  message,
  getRequests,
  getMessages
}

export default connect(mapStateToProps, mapDispatchToProps)(LandingView);
