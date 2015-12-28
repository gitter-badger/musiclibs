import React, { PropTypes } from 'react';

import { ERROR } from '../../async-request-status';
import ManifestResource from '../../resources/manifest-resource';

import ErrorAlert from '../ui/error-alert';
import ManifestViewer from './manifest-viewer';

export default class ManifestDisplay extends React.Component {
    static propTypes = {
        manifestRequest: PropTypes.instanceOf(ManifestResource)
    };

    render()
    {
        const req = this.props.manifestRequest;

        return <ManifestViewer manifestInfo={req && req.value ? req.value : null} />;

        // if (req && req.status === ERROR)
        // {
        //     return (
        //         <div className="container">
        //             <ErrorAlert error={req.error} />
        //         </div>
        //     );
        // }
    }
}

export const __hotReload = true;
