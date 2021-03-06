import React from 'react';
import { Link } from 'react-router';

import { manifestSummaryType } from '../../../iiif-types';

import './search-result-item.css';
import Description from './description';
import ExternalHtml from '../../external-content/external-html';
import HitList from './hit-list';


/** Display basic information for a search result, linking to the full manifest */
export default function Content({ result })
{
    return (
        <div className="search-result__item__content">
            <h2 className="h4">
                <Link to={`/manifests/${result['local_id']}/`}>{result.label}</Link>
            </h2>
            {result.description && <Description text={result.description} />}
            {/* FIXME(wabain): Do margin in CSS */}
            {result.attribution && (
                <dl style={{ marginBottom: 10 }}>
                    <dt>Source</dt>
                    <dd>
                        <ExternalHtml>{result.attribution}</ExternalHtml>
                    </dd>
                </dl>
            )}
            <HitList hits={result.hits} />
        </div>
    );
}

Content.propTypes = {
    result: manifestSummaryType.isRequired
};

