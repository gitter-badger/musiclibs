import React, { PropTypes } from 'react';
import $ from 'jquery';

import Diva from './diva';

/**
 * Wrapper around Diva which handles layout concerns. Initializing
 * Diva with React is awkward because we need access to the DOM to
 * get a reference to the toolbar parent element. This class handles
 * the logic needed to achieve that.
 */
export default class DivaLayout extends React.Component
{
    static propTypes = {
        // Leave this to be validated by Diva
        config: PropTypes.object.isRequired,

        // Optional
        toolbarWrapper: PropTypes.func,
        toolbarWrapperProps: PropTypes.object,

        divaWrapper: PropTypes.func,
        divaWrapperProps: PropTypes.object
    };

    constructor()
    {
        super();

        this.state = {
            toolbarParent: null
        };
    }

    componentDidMount()
    {
        // Get a reference to the toolbar as soon as it becomes available
        // this will trigger a rerender, but all that will happen is the
        // rendering of the Diva component
        this.setState({ toolbarParent: $(this.refs.toolbar) }); // eslint-disable-line react/no-did-mount-set-state
    }

    _getToolbar()
    {
        const ToolbarWrapper = this.props.toolbarWrapper;
        const additionalProps = this.props.toolbarWrapperProps;

        const toolbar = <div ref="toolbar" />;

        return wrap(toolbar, ToolbarWrapper, additionalProps);
    }

    _getDiva()
    {
        const DivaWrapper = this.props.divaWrapper;
        const additionalProps = this.props.divaWrapperProps;

        const config = {
            ...this.props.config,
            toolbarParentObject: this.state.toolbarParent
        };

        const diva = <Diva config={config} />;

        return wrap(diva, DivaWrapper, additionalProps);
    }

    render()
    {
        const toolbar = this._getToolbar();

        // Only initialize Diva once we have access to the toolbar parent element
        const diva = this.state.toolbarParent ? this._getDiva() : null;

        return (
            <div>
                {toolbar}
                {diva}
            </div>
        );
    }
}


function wrap(element, Wrapper, additionalProps)
{
    if (Wrapper)
        return <Wrapper {...additionalProps}>{element}</Wrapper>;

    return element;
}

