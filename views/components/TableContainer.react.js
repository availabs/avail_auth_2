import React, { Component } from 'react';

import "./TableContainer.css"

class TableContainer extends Component {
	constructor(props) {
		super(props);
		this.state = {
			page: 0
		}
	}
	componentDidUpdate() {
		const { page } = this.state,
			{ size, rows } = this.props,
    	maxPage = this.getMaxPage(rows.length, size);
    if (maxPage < page) {
    	this.setState({ page: maxPage });
    }
	}

	getMaxPage() {
		return Math.max(0, Math.ceil( this.props.rows.length / this.props.size) - 1);
	}
	getPage(maxPage) {
		return Math.min(this.state.page, maxPage);
	}
	getSlices() {
		const { page } = this.state,
			{ size } = this.props;
		return [page * size, page * size + size];
	}
	getPagination(maxPage) {
		const SPREAD = 3;

		const { page } = this.state;
		let numAbove = maxPage - page,
			numBelow = page;
		if ((numAbove >= SPREAD) && (numBelow >= SPREAD)) {
			numAbove = numBelow = SPREAD;
		}
		else if (numBelow < SPREAD) {
			numAbove = Math.min((SPREAD * 2) - numBelow, numAbove);
		}
		else if (numAbove < SPREAD) {
			numBelow = Math.min((SPREAD * 2) - numAbove, numBelow);
		}
		const range = [page - numBelow, page + numAbove],
			pagination = [];
		for (let i = range[0]; i <= range[1]; ++i) {
			pagination.push(i);
		}
		return pagination;
	}

	advancePage(adv, maxPage) {
		this.setState({ page: Math.max(0, Math.min(maxPage, this.state.page + adv)) });
	}
	setPage(page) {
		this.setState({ page });
	}

	render() {
		const {
			size,
			headers,
			rows
		} = this.props;
		const maxPage = this.getMaxPage(),
    	page = this.getPage(maxPage),
    	slices = this.getSlices(),
    	pagination = this.getPagination(maxPage);
		return (
      <table className="table table-sm">
      	<thead>
      		{ (maxPage === 0) ? null :
	      		<tr>
	        		<th colSpan={ headers.length } style={ { textAlign: "left" } }>
								<div className="table-container-controls">

		        			<div className="btn-group">
		          			<button onClick={ this.setPage.bind(this, 0) }
		          						className="btn btn-sm btn-primary" style={ { width: "4rem" } }>
		          				first
		          			</button>
		          			<button onClick={ this.advancePage.bind(this, -1, maxPage) }
		          						className="btn btn-sm btn-primary" style={ { width: "4rem" } }>
		          				prev
		          			</button>
		          			{
		          				pagination.map(p =>
		          					<button key={ p } onClick={ () => this.setState({ page: p }) }
		          						className={ `btn btn-sm ${ page === p ? 'btn-info' : 'btn-primary' }` } style={ { width: "3rem" } }>
		          						{ p + 1 }
		          					</button>
		          				)
		          			}
		          			<button onClick={ this.advancePage.bind(this, 1, maxPage) }
		          						className="btn btn-sm btn-primary" style={ { width: "4rem" } }>
		          				next
		          			</button>
		          			<button onClick={ this.setPage.bind(this, maxPage) }
		          						className="btn btn-sm btn-primary" style={ { width: "4rem" } }>
		          				last
		          			</button>
		          		</div>

									<div style={ { paddingTop: "5px" } }>
										{ `Showing ${ page * size + 1 } - ${ Math.min(page * size + size, rows.length) } of ${ rows.length }` }
									</div>

								</div>
	        		</th>
	        	</tr>
	        }
      		<tr>
      			{
      				headers.map((h, i) => {
      					if (typeof h.onClick === "function") {
      						return (
      							<th key={ i }>
      								<button onClick={ h.onClick }
      									className={ `btn btn-sm btn-${ h.color || 'primary' }` }>
      									{ h.label }
      								</button>
      							</th>
      						)
      					}
      					return <th key={ i }>{ h }</th>
      				})
      			}
      		</tr>
      	</thead>
      	<tbody>
      		{
      			rows.slice(...slices)
      		}
      	</tbody>
      </table>
		)
	}
}
TableContainer.defaultProps = {
	size: 5,
	headers: [],
	rows: []
}
export default TableContainer
