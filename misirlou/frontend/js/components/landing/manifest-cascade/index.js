import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import Im from 'immutable';

import * as ManifestActions from '../../../action-creators/manifest';

import ManifestCascade from './cascade';


const MIN_MULTI_COLUMN_WIDTH = 500;


const getState = createSelector(
    state => state.manifests,
    state => state.recentManifests,
    (manifests, recent) =>
    {
        console.log('recent:', recent.value ? recent.value.list.toJS() : null);

        // FIXME: Errors etc
        return {
            manifests,
            recentManifests: recent.value ? recent.value.list : Im.List(),
            recentManifestsLoaded: !!recent.value && !recent.error
        };
    }
);


/** Implement all the DOM and Redux glue needed to get the manifest cascade for the landing page */
@connect(getState)
export default class LandingPageCascade extends React.Component
{
    static propTypes = {
        manifests: PropTypes.objectOf(Im.Map).isRequired,
        recentManifests: PropTypes.objectOf(Im.List).isRequired,
        recentManifestsLoaded: PropTypes.bool.isRequired,
        dispatch: PropTypes.func.isRequired
    };

    constructor()
    {
        super();

        this._cleanupCallbacks = [];

        this.state = {
            manifestGroups: Im.List(),
            moreRequested: false
        };
    }

    componentWillMount()
    {
        if (!this.props.recentManifestsLoaded)
            this.props.dispatch(ManifestActions.requestRecent());

        /* eslint-env browser */

        this._considerLoadingMore();

        // TODO: Compat for matchMedia
        this._mediaQuery = window.matchMedia(`(min-width: ${MIN_MULTI_COLUMN_WIDTH}px)`);
    }

    componentDidMount()
    {
        /* eslint-env browser */

        this._setGlobalListener(
            () => this.forceUpdate(),
            cb => this._mediaQuery.addListener(cb),
            cb => this._mediaQuery.removeListener(cb)
        );

        this._setGlobalListener(
            () => this._considerLoadingMore(),
            cb => window.addEventListener('scroll', cb),
            cb => window.removeEventListener('scroll', cb)
        );

        this._considerLoadingMore();
    }

    componentDidUpdate()
    {
        this._considerLoadingMore();
    }

    componentWillUnmount()
    {
        this._cleanupCallbacks.forEach(cb => cb());
    }

    _considerLoadingMore()
    {
        if (!shouldAddToCascade())
            return;

        const count = this.state.manifestGroups.reduce((c, g) => c + g.size, 0);
        const immediatelyAvailable = this.props.recentManifests.size >= count + 3;

        // Push a new group if there are more manifests available now
        let newGroups;

        if (this.props.recentManifests.size > count)
            newGroups = this.state.manifestGroups.push(this.props.recentManifests.slice(count, count + 3));

        // Request more manifests if we do not have all the manifests we want
        // immediately available and we have not already made a request
        const newRequest = !(immediatelyAvailable || this.state.moreRequested);

        if (newRequest)
            this.props.dispatch({ type: 'LOAD_MORE_RECENT_MANIFESTS' });

        if (newGroups || newRequest)
        {
            // The `moreRequested` value is set to true when we make a request
            // and reset to false whenever we add new manifest groups
            this.setState({
                manifestGroups: newGroups || this.state.manifestGroups,
                moreRequested: newRequest
            });
        }
    }

    /** Fire a listener attachment function and schedule a removal function to be run on unmount */
    _setGlobalListener(cb, attach, remove)
    {
        attach(cb);
        this._cleanupCallbacks.push(() => remove(cb));
    }

    render()
    {
        const groups = this.state.manifestGroups.map(group =>
        {
            return group.map(id => this.props.manifests.get(id));
        });

        return (
            <ManifestCascade manifestGroups={groups}
                             columns={this._mediaQuery.matches ? 3 : 1} />
        );
    }
}

/**
 * Add to the manifest cascade when the height of the window is greater than
 * the height of the content or when we've scrolled to the bottom of the screen.
 */
export function shouldAddToCascade()
{
    const windowHeight = document.documentElement.clientHeight;
    const scrollHeight = document.body.scrollHeight;

    if (windowHeight >= scrollHeight)
        return true;

    // http://stackoverflow.com/questions/20514596/document-documentelement-scrolltop-return-value-differs-in-chrome
    // FIXME: this is probably more backwards compatibility than we really need
    const scrollY = (window.scrollY || window.pageYOffset ||
                     document.body.scrollTop + document.documentElement.scrollTop);

    // Allow some fuzziness with the equality check because we can
    // get floating-point numbers
    return Math.abs(windowHeight + scrollY - scrollHeight) <= 3;
}

export const __hotReload = true;
