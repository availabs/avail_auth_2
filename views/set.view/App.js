import React, { Component } from 'react';
import { connect } from "react-redux"

import App from "../App"

import Set from "./components/Set"

import '../styles/main.css';

class SetView extends Component {
	render() {
		const { authed } = this.props.user;
  	return (
        <App>
          { !authed ? null :
            <Set />
          }
        </App>
  	);
	}
}

const mapStateToProps = state => ({
	user: state.user
})

const mapDispatchToProps = {
}

export default connect(mapStateToProps, mapDispatchToProps)(SetView);