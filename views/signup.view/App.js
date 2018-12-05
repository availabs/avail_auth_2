import React, { Component } from 'react';
import { connect } from "react-redux"

import App from "../App"

import Signup from "./components/Signup"

import '../styles/main.css';

class SignupView extends Component {
	render() {
		const links = [{ href: "/", label: "login" }]
  	return (
        <App links={ links }>
          <Signup />
        </App>
  	);
	}
}

const mapStateToProps = state => ({
})

const mapDispatchToProps = {
}

export default connect(mapStateToProps, mapDispatchToProps)(SignupView);