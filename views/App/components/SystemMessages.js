import React, { Component } from 'react';
import { connect } from "react-redux"

import { dismiss } from "../../store/modules/systemMessages.module"

class SystemMessage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      timeout: null,
      state: 'show'
    }
  }
  componentDidMount() {
    if (this.props.duration) {
      const timeout = setTimeout(this.dismiss.bind(this), this.props.duration);
      this.setState({ timeout });
    }
  }
  dismiss() {
    clearTimeout(this.state.timeout);
    setTimeout(this.props.dismiss, 500, this.props.id);
    this.setState({ state: 'hide' });
  }
  render() {
    return (
      <div className={ `system-message ${ this.state.state } alert alert-${ this.props.type }` }
        style={ { top: `${ this.props.top }px` } }>
        <span>{ this.props.message }</span>
        <button className="btn btn-sm btn-primary"
          onClick={ this.dismiss.bind(this) }>dismiss</button>
      </div>
    )
  }
}

class ConfirmMessage extends SystemMessage {
  confirm() {
    this.dismiss();
    this.props.onConfirm();
  }
  render() {
    return (
      <div className={ `system-message ${ this.state.state } alert alert-${ this.props.type }` }
        style={ { top: `${ this.props.top }px` } }>
        <span>{ this.props.message }</span>
        <button className="btn btn-sm btn-primary"
          onClick={ this.dismiss.bind(this) }>dismiss</button>
        <button className="btn btn-sm btn-danger"
          onClick={ this.confirm.bind(this) }>confirm</button>
      </div>
    )
  }
}

class SystemMessages extends Component {
	render() {
    const { messages } = this.props;
  	return (
    		<div className="system-message-container">
          {
            messages.map((m, i) => typeof m.onConfirm === 'function' ?
              <ConfirmMessage key={ m.id } { ...m } top={ i * 57 }
                dismiss={ this.props.dismiss }/> :
              <SystemMessage key={ m.id } { ...m } top={ i * 57 }
                dismiss={ this.props.dismiss }/>
            )
          }
    		</div>
  	);
	}
}

const mapStateToProps = state => ({
  messages: state.systemMessages
})

const mapDispatchToProps = {
	dismiss
}

export default connect(mapStateToProps, mapDispatchToProps)(SystemMessages);