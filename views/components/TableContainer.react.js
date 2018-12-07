import React, { Component } from 'react';

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
		const { page } = this.state;
		let numAbove = maxPage - page,
			numBelow = page;
		if ((numAbove > 2) && (numBelow > 2)) {
			numAbove = numBelow = 2;
		}
		else if (numBelow < 2) {
			numAbove = Math.min(4 - numBelow, numAbove);
		}
		else if (numAbove < 2) {
			numBelow = Math.min(4 - numAbove, numBelow);
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
	        			<div className="btn-group">
	          			<button onClick={ () => this.setPage.bind(this, 0) }
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
	          						className="btn btn-sm btn-primary" style={ { width: "3rem" } }>
	          						{ p + 1 }
	          					</button>
	          				)
	          			}
	          			<button onClick={ this.advancePage.bind(this, 1, maxPage) }
	          						className="btn btn-sm btn-primary" style={ { width: "4rem" } }>
	          				next
	          			</button>
	          			<button onClick={ () => this.setPage.bind(this, maxPage) }
	          						className="btn btn-sm btn-primary" style={ { width: "4rem" } }>
	          				last
	          			</button>
	          		</div>
	        		</th>
	        	</tr>
	        }
      		<tr>
      			{
      				headers.map((h, i) => <th key={ i }>{ h }</th>)
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