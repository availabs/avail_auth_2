import React, { Component } from 'react';
import { connect } from "react-redux"

import App from "../App"

import Reset from "./components/Reset"

import '../styles/main.css';

class ResetView extends Component {
	render() {
		const links = [{ href: "/", label: "login" }];
  	return (
        <App links={ links }>
          <Reset />
        </App>
  	);
	}
}

const mapStateToProps = state => ({
})

const mapDispatchToProps = {
}

export default connect(mapStateToProps, mapDispatchToProps)(ResetView);