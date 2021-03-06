import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { withRouter, locationShape, routerShape } from 'react-router';
import { createSelector } from 'reselect';

import SearchResource from '../../resources/search-resource';
import * as Search from '../../action-creators/search';

import SearchInput from './search-input';
import SearchResults from './search-results';


/* State selectors */

const getState = createSelector(
    ({ search }) => search,
    search => ({ search })
);


/* Components */

@withRouter
@connect(getState)
export default class SearchContainer extends React.Component
{
    static propTypes = {
        dispatch: PropTypes.func.isRequired,
        search: PropTypes.shape({
            current: PropTypes.instanceOf(SearchResource).isRequired,
            stale: PropTypes.instanceOf(SearchResource).isRequired
        }).isRequired,
        location: locationShape.isRequired,
        router: routerShape.isRequired
    };

    // Load the query from the URL
    componentDidMount()
    {
        const urlQuery = getQueryFromLocation(this.props.location);

        if (this.props.search.current.query !== urlQuery)
            this._loadQuery(urlQuery);
    }

    componentWillReceiveProps(next)
    {
        const nextCurrentQuery = next.search.current.query;

        if (nextCurrentQuery !== this.props.search.current.query)
        {
            const routerQuery = nextCurrentQuery ? { q: nextCurrentQuery } : {};

            this.props.router.replace({
                ...this.props.location,
                query: routerQuery,
                state: {
                    searchQueryHandled: true
                }
            });

            return;
        }

        const priorLocQuery = getQueryFromLocation(this.props.location);
        const nextLocQuery = getQueryFromLocation(next.location);
        const nextLocState = next.location.state;

        if (nextLocQuery !== priorLocQuery && !(nextLocState && nextLocState.searchQueryHandled))
            this._loadQuery(nextLocQuery);
    }

    componentWillUnmount()
    {
        if (this.props.search.current.query)
            this.props.dispatch(Search.clear());
    }

    _loadQuery(query)
    {
        if (!query)
        {
            this.props.dispatch(Search.clear());
            return;
        }

        this.props.dispatch(Search.request({
            query,
            suggestions: true
        }));
    }

    _loadMore(query)
    {
        this.props.dispatch(Search.loadNextPage({ query }));
    }

    render()
    {
        const search = this.props.search;
        const query = search.current.query;

        let resultDisplay;

        if (query)
        {
            resultDisplay = (
                <SearchResults search={search}
                               onLoadMore={() => this._loadMore(query)}
                               onRetry={() => this._loadQuery(query)} />
            );
        }

        return (
            <div>
                <SearchInput
                        inputClasses="input-lg"
                        query={query}
                        onChange={({ target: { value } }) => this._loadQuery(value)} />
                {resultDisplay}
            </div>
        );
    }
}

function getQueryFromLocation(loc)
{
    return loc.query.q || null;
}
