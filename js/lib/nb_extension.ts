// This file contains the javascript that is run when the notebook is loaded.
// It contains some requirejs configuration and the `load_ipython_extension`
// which is required for any notebook extension.

// Configure requirejs

const __webpack_public_path__ = document.querySelector('body').getAttribute('data-base-url') + 'nbextensions/yt-widgets';


if (window.require) {
    window.require.config({
        map: {
            "*" : {
                "@data-exp-lab/yt-widgets": "nbextensions/yt-widgets/index",
            }
        }
    });
}

// Export the required load_ipython_extension
export = {
    load_ipython_extension: function() {}
};
