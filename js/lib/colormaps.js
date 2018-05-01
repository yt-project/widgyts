var widgets = require('@jupyter-widgets/base');
var ipydatawidgets = require('jupyter-dataserializers');
var yt_tools = require('yt-tools');
var mpl_cmap_obj = {}

var CMapModel = widgets.WidgetModel.extend({

    defaults: function() {
        },

    initialize: function() {
        widgets.WidgetModel.prototype.initialize.apply(this);

        console.log('initializing colormaps object in WASM')
        this.colormaps = yt_tools.Colormaps.new();
        this.add_mpl_colormaps();

    },

    add_mpl_colormaps: function() {
        // initializes the colormaps module from yt tools and adds the 
        // arrays stored in the self.cmaps dict on the python side into
        // the colormaps object in wasm.
        //
        var mapname = '';
        var maptable;
        for (mapname in mpl_cmap_obj) {
            console.log('adding in colormap of size ')
            this.colormaps.add_cmap(mapname, mpl_cmap_obj)
        },
    }, 
}, {
    model_module: 'yt-jscanvas',
    model_name: 'CMapModel',
    model_module_version: '0.1.0',
});

module.exports = {
    CMapModel : CMapModel,
};
