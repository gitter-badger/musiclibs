import React, { PropTypes } from 'react';
import Im from 'immutable';

import DescriptionList from '../../ui/description-list';

import './iiif-presentation-metadata.css!';

const INVALID_LANGUAGE = Symbol('invalid language');

export default function IIIFPresentationMetadata({ manifest, lang })
{
    const id = getLink(manifest);
    const description = getValue(manifest.description, lang);
    const metadataTerms = getMetadataTerms(manifest.metadata, lang);

    const links = Im.Seq({
        related: 'Related material',
        within: 'Collection',
        seeAlso: 'Additional data'
    }).map((text, key) => ({ text, href: getLink(manifest[key]) }))
      .filter(link => link.href)
      .toArray();

    const attribution = getValue(manifest.attribution, lang);
    const logo = getLink(manifest.logo);
    const license = getLink(manifest.license);

    // TODO: service?

    return (
        <div>
            {description && <p>{description}</p>}
            {metadataTerms && <DescriptionList terms={metadataTerms} />}

            <h4>Other links</h4>
            <table>
                <tbody>
                    <tr>
                        <td>
                            <a href={id} target="_blank">
                                <img src="/static/img/iiif-logo.jpg" style={/* FIXME */{ height: 20, paddingRight: 10 }} />
                            </a>
                        </td>
                        <td><a href={id} target="_blank">Image manifest</a></td>
                    </tr>
                    {links.map(({ href, text }, i) => (
                        <tr key={i}>
                            <td />
                            <td><a href={href} target="_blank">{text}</a></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <hr />

            <div className="text-center">
                {logo && <img src={logo} className="iiif-metadata__logo" />}
                {attribution && <div>{attribution}</div>}
                {license && <div><a href={license} target="_blank"><small className="text-muted">Terms of use</small></a></div>}
            </div>
        </div>
    );
}

IIIFPresentationMetadata.propTypes = {
    lang: PropTypes.string.isRequired,

    // Don't validate other properties via React
    manifest: PropTypes.shape({
        '@context': PropTypes.string.isRequired,
        '@id': PropTypes.string.isRequired
    }).isRequired
};

/**
 * Map key/value metadata pairs into validated term/description objects with
 * string values.
 */
function getMetadataTerms(metadata, preferredLanguage)
{
    if (!Array.isArray(metadata))
        return null;

    const terms = metadata.map(pairing =>
    {
        if (!pairing)
            return null;

        let { label, value } = pairing;

        label = getValue(label, preferredLanguage);
        value = getValue(value, preferredLanguage);

        if (!label || !value)
            return null;

        return {
            term: label,
            description: value
        };
    }).filter(term => term !== null);

    if (terms.length === 0)
        return null;

    return terms;
}

// FIXME: Handle repeated values
function getLink(value)
{
    if (!value)
        return null;

    if (typeof value === 'string')
        return value;

    return getLink(value['@id']);
}

function getValue(property, preferredLanguage)
{
    const normalized = normalizeProperty(property);

    if (!normalized)
        return null;

    if (!Array.isArray(normalized))
        return normalized.value;

    // Try to get a value with a good language, defaulting to the first value
    let best;

    for (const entry of normalized)
    {
        if (!best)
        {
            best = entry;
            continue;
        }

        // If this matches the preferred language, break
        if (langMatches(entry.lang, preferredLanguage))
        {
            best = entry;
            break;
        }

        // At least pick something which doesn't explicitly have the wrong language
        if (best.lang && !entry.lang)
            best = entry;
    }

    return best.value;
}

function normalizeProperty(prop)
{
    if (!prop)
        return null;

    if (typeof prop === 'string')
        return { value: prop, lang: null };

    if (Array.isArray(prop))
    {
        const normalized = prop.map(normalizeProperty).filter(p => p !== null);

        switch (normalized.length)
        {
            case 0:
                return null;

            case 1:
                return normalized[0];

            default:
                return normalized;
        }
    }

    if (typeof prop === 'object')
    {
        const value = prop['@value'];

        if (!value || typeof value !== 'string')
            return null;

        let lang = prop['@language'];

        if (!lang)
            lang = null;

        if (typeof lang !== 'string')
            lang = INVALID_LANGUAGE;

        return { value, lang };
    }

    return null;
}

function langMatches(actual, preferred)
{
    if (!actual || actual === INVALID_LANGUAGE)
        return false;

    return actual === preferred || actual.slice(0, actual.indexOf('-')) === preferred;
}

export const __hotReload = true;
