import React, { PropTypes } from 'react';

import { ERROR, SUCCESS, PENDING } from '../../async-request-status';
import SearchResource from '../../resources/search-resource';

import ErrorAlert from '../ui/error-alert';

/**
 * Provide actions after a list of search results depending on the state
 * of the search resource
 */
function SearchFollowupActions({ resource, onLoadMore, onRetry })
{
    switch (resource.status)
    {
        case SUCCESS:
            if (!resource.value.nextPage)
            {
                // Nothing to do
                return <noscript />;
            }

            return (
                <div>
                    <button className="btn btn-default center-block" onClick={onLoadMore}>Load more</button>
                </div>
            );

        case ERROR:
            return (
                <ErrorAlert title="Search failed">
                    <button className="btn btn-default center-block" onClick={onRetry}>Retry</button>
                </ErrorAlert>
            );

        case PENDING:
            // Demonstrate that we're loading more results
            return (
                <div>
                    <button className="btn btn-default center-block" disabled={true}>Loading...</button>
                </div>
            );
    }
}

SearchFollowupActions.propTypes = {
    resource: PropTypes.instanceOf(SearchResource).isRequired,

    // Optional
    onLoadMore: PropTypes.func,
    onRetry: PropTypes.func
};

export default SearchFollowupActions;

export const __hotReload = true;
