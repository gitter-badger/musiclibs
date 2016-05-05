import Im from 'immutable';

import { RECENT_MANIFESTS_REQUEST, MANIFEST_REQUEST, MANIFEST_UPLOAD } from '../actions';
import { SUCCESS, PENDING } from '../async-request-status';

import ManifestResource from '../resources/manifest-resource';

export const SUCCESS_LOCAL = 'success_local';

const initialState = Im.Map();

/**
 * Update the state when a request for a manifest is made or completed,
 * or when a manifest is successfully uploaded.
 */
export default function reduceManifests(state = initialState, action = {})
{
    switch (action.type)
    {
        case MANIFEST_REQUEST:
            return registerManifest(state, action.payload);

        case MANIFEST_UPLOAD:
            // Only handle upload actions if the upload was successful
            if (action.payload.status === SUCCESS)
                return registerUploadedManifest(state, action.payload.resource.id, action.payload.remoteUrl);

            return state;

        case RECENT_MANIFESTS_REQUEST:
            // We load recent manifests when the call succeeds
            if (action.payload.status === SUCCESS)
            {
                let newState = state;

                for (const manifest of action.payload.resource)
                {
                    newState = registerManifest(newState, {
                        status: SUCCESS_LOCAL,
                        id: manifest.id,
                        resource: manifest
                    });
                }

                return newState;
            }

            return state;

        default:
            return state;
    }
}

/**
 * Update the state by setting the value of the manuscript to reflect the
 * new status.
 *
 * @param state
 * @param payload
 * @returns Im.Map<String,ManifestResource>
 */
export function registerManifest(state, { id, status, resource, manifest, error })
{
    return state.update(id, (res = new ManifestResource({ id })) =>
    {
        // Success with the local lookup results in a resource still in a pending state
        if (status === SUCCESS_LOCAL)
        {
            return res.setStatus(SUCCESS, { remoteUrl: resource['remote_url'] })
                      .setStatus(PENDING);
        }

        if (status === SUCCESS)
        {
            return res.set('remoteManifestLoaded', true)
                      .setStatus(status, { manifest });
        }

        return res.setStatus(status, error || null);
    });
}

/** Add an entry for a just-uploaded manifest */
export function registerUploadedManifest(state, id, remoteUrl)
{
    return state.set(id, (new ManifestResource({ id })).setStatus(SUCCESS, { remoteUrl }));
}

