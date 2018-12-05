import React, { Component } from 'react';
import { connect } from "react-redux"

import {
  message
} from "../../store/modules/systemMessages.module"

class Overlay extends Component {
	render() {
		return (
			<div className={ `overlay-container ${ this.props.state }` }>
				<div className="overlay-content">
					<div className="overlay-body">
						{ this.props.children }
					</div>
					<div className="overlay-footer clearfix">
						<button className="btn btn-sm btn-primary float-left"
							onClick={ e => this.props.dismiss() }>
							{ this.props.dismissLabel }
						</button>
						<button className="btn btn-sm btn-success float-right"
							onClick={ e => this.props.accept() }>
							{ this.props.acceptLabel }
						</button>
					</div>
				</div>
			</div>
		)
	}
}

Overlay.defaultProps = {
	state: 'hide',
	dismissLabel: "dismiss",
	dismiss: () => {},
	acceptLabel: "accept",
	accept: () => {}
}

const mapStateToProps = state => ({
})

const mapDispatchToProps = {
  message
}

export default connect(mapStateToProps, mapDispatchToProps)(Overlay);