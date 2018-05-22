var widgets = require('@jupyter-widgets/base');
var ipydatawidgets = require('jupyter-dataserializers');
var yt_tools = require('yt-tools');

var CMapModel = widgets.WidgetModel.extend({

    defaults: function() {
        return _.extend(widgets.WidgetModel.prototype.defaults.call(this), {
            _model_name: 'CMapModel',
            _model_module: 'yt-jscanvas',
            _model_module_version: '0.1.0',

            cmaps: undefined,
        });
    },

    initialize: function() {
        console.log('initializing colormaps object in WASM');
    },

    normalize: function(name, buffer, take_log) {
        // normalizes a given buffer with a colormap name. Requires colormaps
        // to be loaded in to wasm, so requires add_mpl_colormaps to be called 
        // at this time. 
        return this.add_mpl_colormaps_to_wasm().then(function(colormaps) {
            array = colormaps.normalize(name, buffer, take_log);
            return array
        });
    },

    add_mpl_colormaps_to_wasm: function() {
        // initializes the wasm colormaps module from yt tools and adds the 
        // arrays stored in the self.cmaps dict on the python side into
        // the colormaps object in wasm.
        
        return yt_tools.booted.then(function(yt_tools) {
            this.colormaps = yt_tools.Colormaps.new();
        
            var mpl_cmap_obj = this.get('cmaps');
            // console.log("imported the following maps:", Object.keys(mpl_cmap_obj));
            for (var mapname in mpl_cmap_obj) {
                if (mpl_cmap_obj.hasOwnProperty(mapname)) {
                    var maptable = mpl_cmap_obj[mapname];
                    this.colormaps.add_colormap(mapname, maptable);
                }
            }
            return this.colormaps
        }.bind(this));
    }, 
}, {
    model_module: 'yt-jscanvas',
    model_name: 'CMapModel',
    model_module_version: '0.1.0',
});

module.exports = {
    CMapModel : CMapModel,
};
