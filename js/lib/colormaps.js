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
        this.add_mpl_colormaps_to_wasm().then(function(colormaps) {
            console.log('double checking refs');
            console.log(colormaps.normalize('viridis', [1.0], true));
        });

    },

    normalize: function(name, buffer, take_log) {
        return this.add_mpl_colormaps_to_wasm().then(function(colormaps) {
            console.log('normalizing buffer with %s colormap', name);
            array = colormaps.normalize(name, buffer, take_log);
            return array
        });
    },

    add_mpl_colormaps_to_wasm: function() {
        // initializes the colormaps module from yt tools and adds the 
        // arrays stored in the self.cmaps dict on the python side into
        // the colormaps object in wasm.
        
        return yt_tools.booted.then(function() {
            console.log('Sending available cmaps to WASM...')
            this.colormaps = yt_tools.Colormaps.new();
        
            var mpl_cmap_obj = this.get('cmaps');
            console.log("imported the following maps:", Object.keys(mpl_cmap_obj));
            for (var mapname in mpl_cmap_obj) {
                if (mpl_cmap_obj.hasOwnProperty(mapname)) {
                    var maptable = mpl_cmap_obj[mapname];
                    this.colormaps.add_colormap(mapname, maptable);
                }
            }
            // just check that we can access a few of the cmaps 
            console.log(this.colormaps.normalize('viridis', [1.0], true));
            console.log(this.colormaps.normalize('jet', [1.0], true));
            console.log(this.colormaps.normalize('tab20', [1.0], true));
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
