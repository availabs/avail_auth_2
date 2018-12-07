import React, { Component } from 'react';
import { connect } from "react-redux"

import { auth } from "../store/modules/user.module"

import SystemMessages from "./components/SystemMessages"

import '../styles/main.css';

class App extends Component {
	componentDidMount() {
		this.props.auth();
	}
  onMouseOver(e) {
    e.target.closest('.header-popup').classList.add('active');
  }
  onMouseOut(e) {
    const classList = e.target.closest('.header-popup').classList;
    classList.remove('active');
    classList.add('inactive');
    setTimeout(() => classList.remove('inactive'), 300);
  }
	render() {
    const { current } = this.props;
  	return (
    		<div className="App">
      		<header className="App-header">
        			<h1 className="App-title">AVAIL Auth</h1>
              <div className="btn-group btn-group-sm">
                {
                  this.props.headerItems.map(({ onClick, label, key }) =>
                    <button key={ key } onClick={ onClick }
                      className={ `btn btn-sm ${ current === key ? 'btn-info' : 'btn-primary' }` }>
                      { label } {key}
                    </button>
                  )
                }
              </div>
      		</header>
          { this.props.children }
          {
            this.props.links.map((link, i) =>
              <div style={ { marginBottom: "10px" } } key={ i }>
                <a href={ link.href }
                  className="btn btn-sm btn-info">
                  { link.label }
                </a>
              </div>
            )
          }
          <SystemMessages />
    		</div>
  	);
	}
}

App.defaultProps = {
  headerItems: [],
  links: []
}

const mapStateToProps = state => ({
})

const mapDispatchToProps = {
	auth
}

export default connect(mapStateToProps, mapDispatchToProps)(App);