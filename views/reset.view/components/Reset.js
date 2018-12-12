import React, { Component } from 'react';
import { connect } from "react-redux"

import {
  passwordReset
} from "../../store/modules/user.module"

import {
  message
} from "../../store/modules/systemMessages.module"

class Set extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      email_confirm: ""
    }
  }
  componentDidMount() {
    this.reset();
  }
  reset() {
    this.setState({ email: "", email_confirm: "" });
    document.getElementById("email").focus();
  }
  onChange(e) {
    this.setState({ [e.target.id]: e.target.value });
  }
  valdiate(e) {
    e.preventDefault();
    const {
      email,
      email_confirm
    } = this.state;
    const errors = [];
    if (!email) {
      errors.push("Missing email.");
    }
    if (!email_confirm) {
      errors.push("Missing email confirm.");
    }
    if (email_confirm !== email) {
      errors.push("Passwords do not match.");
    }
    errors.forEach(error => this.props.message(error));
    if (!errors.length) {
      this.passwordReset();
    }
  }
  passwordReset() {
    this.props.passwordReset(this.state.email);
    this.reset();
  }
  render() {
    const {
      email,
      email_confirm
    } = this.state;
    return (
      <div className="container">
        <h3>Reset Password</h3>
        <form onSubmit={ this.valdiate.bind(this) }>

          <div className="form-group row">
            <div className="col-2"/>
            <label htmlFor="email" style={ { textAlign: "left" } }
              className="col-3 col-form-label">Email</label>
            <div className="col-5">
              <input type="email" id="email"
                onChange={ this.onChange.bind(this) }
                placeholder="enter email..."
                className="form-control form-control-sm"
                value={ email }/>
            </div>
          </div>

          <div className="form-group row">
            <div className="col-2"/>
            <label htmlFor="email_confirm" style={ { textAlign: "left" } }
              className="col-3 col-form-label">Confirm Email</label>
            <div className="col-5">
              <input type="email" id="email_confirm"
                onChange={ this.onChange.bind(this) }
                placeholder="confirm email..."
                className="form-control form-control-sm"
                value={ email_confirm }/>
            </div>
          </div>

          <div className="form-group">
            <input type="submit" value="send"
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
  passwordReset,
  message
}

export default connect(mapStateToProps, mapDispatchToProps)(Set);