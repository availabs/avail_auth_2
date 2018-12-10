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

import '../styles/main.css';

class LandingView extends Component {
  constructor(props) {
    super(props)
    this.state = {
      view: "home"
    }
    if (localStorage && localStorage.getItem("landing-state")) {
      this.state = JSON.parse(localStorage.getItem("landing-state"));
    }
  }

  setView(view) {
    this.setState({ view });
    if (localStorage) {
      localStorage.setItem("landing-state", JSON.stringify({ view }));
    }
  }
  getView() {
    const { view } = this.state;
    switch (view) {
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
        key: 'home'
      })
    }
    if (authed && (authLevel > 0)) {
      headerItems.push(
        { onClick: () => this.setView("pending"),
          label: "pending requests",
          key: 'pending' },
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
          key: 'logout'
        }
      )
    }

    return headerItems
  }
	render() {
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
        { authed ? null :
          <Login />
        }
        { !authed ? null :
          this.getView()
        }
      </App>
  	);
	}
}

const mapStateToProps = state => ({
	user: state.user
})

const mapDispatchToProps = {
	logout,
  message
}

export default connect(mapStateToProps, mapDispatchToProps)(LandingView);