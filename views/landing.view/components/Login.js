import React, { Component } from 'react';
import { connect } from "react-redux"

import { login } from "../../store/modules/user.module"
import { message } from "../../store/modules/systemMessages.module"

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      password: ""
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
      email,
      password
    } = this.state;
    const errors = [];
    if (!email) {
      errors.push("Missing email.");
    }
    if (!password) {
      errors.push("Missing password");
    }
    errors.forEach(error => this.props.message(error));
    if (!errors.length) {
      this.login();
    }
  }
  login() {
    const { email, password } = this.state;
    this.props.login(email, password);
    this.reset();
  }
  reset() {
    this.setState({ email: "", password: "" });
    document.getElementById("email").focus();
  }
  render() {
    const {
      email,
      password
    } = this.state;
    return (
      <div className="container">
        <h3>Login</h3>
        <form onSubmit={ this.valdiate.bind(this) }>

          <div className="form-group row">
            <div className="col-2"/>
            <label htmlFor="email" style={ { textAlign: "left" } }
              className="col-3 col-form-label">Email</label>
            <div className="col-5">
              <input type="email" id="email"
                onChange={ this.onChange.bind(this) }
                className="form-control form-control-sm"
                placeholder="enter email..."
                value={ email }/>
            </div>
          </div>

          <div className="form-group row">
            <div className="col-2"/>
            <label htmlFor="password" style={ { textAlign: "left" } }
              className="col-3 col-form-label">Password</label>
            <div className="col-5">
              <input type="password" id="password"
                onChange={ this.onChange.bind(this) }
                className="form-control form-control-sm"
                placeholder="enter password..."
                value={ password }/>
            </div>
          </div>

          <div className="form-group">
            <input type="submit" value="submit"
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
  message,
  login
}

export default connect(mapStateToProps, mapDispatchToProps)(Login);