var widgets = require('@jupyter-widgets/base');
var ipydatawidgets = require('jupyter-dataserializers');
var yt_tools = require('yt-tools');

var CMapModel = widgets.WidgetModel.extend({

    defaults: function() {
        return _.extend(widgets.WidgetModel.prototype.defaults.call(this), {
            _model_name: 'CMapModel',
            _model_module: 'yt-jscanvas',
            _model_module_version: '0.1.0',

            cmaps: undefined
        });
    },

    initialize: function() {
        // widgets.WidgetModel.prototype.initialize.apply(this);

        console.log('initializing colormaps object in WASM');
        yt_tools.booted.then(function() {
            this.colormaps = yt_tools.Colormaps.new();
        }.bind(this));
        this.add_mpl_colormaps_to_wasm();

    },

    add_mpl_colormaps_to_wasm: function() {
        // initializes the colormaps module from yt tools and adds the 
        // arrays stored in the self.cmaps dict on the python side into
        // the colormaps object in wasm.
        
        var mpl_cmap_obj = this.get('cmaps');
        console.log(mpl_cmap_obj);
        console.log(Object.keys(mpl_cmap_obj));
        for (var mapname in mpl_cmap_obj) {
            if (mpl_cmap_obj.hasOwnProperty(mapname)) {
                var maptable = mpl_cmap_obj[mapname];
                console.log(mapname, maptable);
                // this.colormaps.add_cmap(mapnanme, maptable);
            }
        }
    }, 
}, {
    model_module: 'yt-jscanvas',
    model_name: 'CMapModel',
    model_module_version: '0.1.0',
});

module.exports = {
    CMapModel : CMapModel,
};
