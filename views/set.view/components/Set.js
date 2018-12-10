import React, { Component } from 'react';
import { connect } from "react-redux"

import {
  passwordSet,
  signup
} from "../../store/modules/user.module"

import {
  message
} from "../../store/modules/systemMessages.module"

class Set extends Component {
  constructor(props) {
    super(props);
    this.state = {
      password: "",
      password_confirm: ""
    }
  }
  componentDidMount() {
    this.reset();
  }
  reset() {
    this.setState({ password: "", password_confirm: "" });
    document.getElementById("password").focus();
  }
  onChange(e) {
    this.setState({ [e.target.id]: e.target.value });
  }
  valdiate(e) {
    e.preventDefault();
    const {
      password,
      password_confirm
    } = this.state;
    const errors = [];
    if (!password) {
      errors.push("Missing password.");
    }
    if (!password_confirm) {
      errors.push("Missing password confirm.");
    }
    if (password_confirm !== password) {
      errors.push("Passwords do not match.");
    }
    errors.forEach(error => this.props.message(error));
    if (!errors.length) {
      this.passwordSet();
    }
  }
  passwordSet() {
    // const onSet = () => {
    //   this.props.message("Redirecting to landing...");
    //   setTimeout(() => document.location.href = 'http://localhost:3333/', 5000);
    // }
    this.props.passwordSet(this.state.password);//, onSet);
    this.reset();
  }
  render() {
    const {
      password,
      password_confirm
    } = this.state;
    return (
      <div className="container">
        <h3>Set New Password</h3>
        <form onSubmit={ this.valdiate.bind(this) }>

          <div className="form-group row">
            <div className="col-2"/>
            <label htmlFor="password" style={ { textAlign: "left" } }
              className="col-3 col-form-label">Password</label>
            <div className="col-5">
              <input type="password" id="password"
                onChange={ this.onChange.bind(this) }
                placeholder="enter new password..."
                className="form-control form-control-sm"
                value={ password }/>
            </div>
          </div>

          <div className="form-group row">
            <div className="col-2"/>
            <label htmlFor="password_confirm" style={ { textAlign: "left" } }
              className="col-3 col-form-label">Confirm Password</label>
            <div className="col-5">
              <input type="password" id="password_confirm"
                onChange={ this.onChange.bind(this) }
                placeholder="confirm new password..."
                className="form-control form-control-sm"
                value={ password_confirm }/>
            </div>
          </div>
          
          <div>
            <input type="submit" value="set"
              className="btn btn-sm btn-primary"/>
          </div>
        </form>
      </div>
    )
  }
}

const mapStateToProps = state => ({
})

const mapDispatchToProps = {
  passwordSet,
  signup,
  message
}

export default connect(mapStateToProps, mapDispatchToProps)(Set);