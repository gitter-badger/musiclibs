import React, { PropTypes } from 'react';

import 'diva.js/build/css/diva.min.css!';

import ManifestResource from '../../resources/manifest-resource';

import DivaLayout from './diva-layout';
import IIIFPresentationMetadata from './metadata/iiif-presentation-metadata';
import MetadataPlaceholder from './metadata/placeholder';

/** Render a Diva viewer and display Presentation API metadata */
export default function ManifestViewer({ manifestInfo })
{
    let divaConfig;
    let divaPlaceholder;

    if (manifestInfo)
    {
        divaConfig = {
            objectData: manifestInfo.remoteUrl,
            enableAutoTitle: false,
            enableImageTitles: false
        };
    }
    else
    {
        // Fake the Diva loading state if we don't have the URL for the manifest yet
        divaPlaceholder = (
            <div className="diva-outer">
                <div className="diva-throbber" style={{ display: 'block' }} />
            </div>
        );
    }

    let metadata;

    if (manifestInfo && manifestInfo.manifest)
        metadata = <IIIFPresentationMetadata manifest={manifestInfo.manifest} lang="en" />;
    else
        metadata = <MetadataPlaceholder />;

    // TODO: Title access

    return (
        <div className="container-fluid">
            <DivaLayout config={divaConfig} divaPlaceholder={divaPlaceholder} titleComponent={<h1>Hello world</h1>}>
                {metadata}
            </DivaLayout>
        </div>
    );
}

ManifestViewer.propTypes = {
    // Optional
    manifestInfo: PropTypes.instanceOf(ManifestResource.ValueClass)
};

export const __hotReload = true;
