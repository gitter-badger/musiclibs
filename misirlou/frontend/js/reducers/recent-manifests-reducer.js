import Im from 'immutable';
import { RECENT_MANIFEST_REQUEST_STATUS_CHANGE } from '../actions';
import { SUCCESS, PENDING, ERROR } from '../async-request-status';

import RecentManifestsResource from '../resources/recent-manifests-resource';

/**
 * Update the state when a request for a manifest is made or completed,
 * or when a manifest is successfully uploaded.
 */
export default function reduceRecentManifests(state = new RecentManifestsResource(), action = {})
{
    switch (action.type)
    {
        case RECENT_MANIFEST_REQUEST_STATUS_CHANGE:
            return handleStatusChange(state, action.payload);

        default:
            return state;
    }
}

/**
 * Update the state by setting the value of the manuscript to reflect the
 * new status.
 *
 * @param state
 * @param id
 * @param payload
 * @returns Im.Map<String,AsyncStatusRecord>
 */
export function handleStatusChange(state, { status, resource, error })
{
    let value

    if (resource)
    {
        value = {
            list: Im.Seq(resource).map(info => info.id).toList()
        };
    }
    else if (error)
    {
        value = error
    }

    return state.setStatus(status, value)
}

export const __hotReload = true;
