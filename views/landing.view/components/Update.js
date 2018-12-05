import React, { Component } from 'react';
import { connect } from "react-redux"

import { passwordUpdate } from "../../store/modules/user.module"
import { message } from "../../store/modules/systemMessages.module"

class Update extends Component {
  constructor(props) {
    super(props);
    this.state = {
      current: "",
      password: "",
      password_confirm: ""
    }
  }
  componentDidMount() {
    this.reset();
  }
  onChange(e) {
    this.setState({ [e.target.id]: e.target.value });
  }
  valdiate(e) {
    e.preventDefault();
    const {
      current,
      password,
      password_confirm
    } = this.state;
    const errors = [];
    if (!current) {
      errors.push("Missing current password.");
    }
    if (!password) {
      errors.push("Missing new password.");
    }
    if (!password_confirm) {
      errors.push("Missing new password confirm.");
    }
    if (password_confirm !== password) {
      errors.push("Passwords do not match.");
    }
    errors.forEach(error => this.props.message(error));
    if (!errors.length) {
      this.passwordUpdate();
    }
  }
  passwordUpdate() {
    const { current, password } = this.state;
    this.props.passwordUpdate(current, password);
    this.reset();
  }
  reset() {
    this.setState({ current: "", password: "", password_confirm: "" });
    document.getElementById("current").focus();
  }
  render() {
    const {
      current,
      password,
      password_confirm
    } = this.state;
    return (
      <div className="container">
        <h3>Update Password</h3>
        <form onSubmit={ this.valdiate.bind(this) }>

          <div className="form-group row">
            <div className="col-2"/>
            <label htmlFor="current" style={ { textAlign: "left" } }
              className="col-3 col-form-label">Current Password</label>
            <div className="col-5">
              <input type="password" id="current"
                onChange={ this.onChange.bind(this) }
                placeholder="enter current password..."
                className="form-control form-control-sm"
                value={ current }/>
            </div>
          </div>

          <div className="form-group row">
            <div className="col-2"/>
            <label htmlFor="password" style={ { textAlign: "left" } }
              className="col-3 col-form-label">New Password</label>
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
              className="col-3 col-form-label">Confirm New Password</label>
            <div className="col-5">
              <input type="password" id="password_confirm"
                onChange={ this.onChange.bind(this) }
                placeholder="confirm new password..."
                className="form-control form-control-sm"
                value={ password_confirm }/>
            </div>
          </div>

          <div>
            <input className="btn btn-sm btn-primary"
              type="submit" value="submit"/>
          </div>
          
        </form>
      </div>
    )
  }
}

const mapStateToProps = state => ({
})

const mapDispatchToProps = {
  message,
  passwordUpdate
}

export default connect(mapStateToProps, mapDispatchToProps)(Update);