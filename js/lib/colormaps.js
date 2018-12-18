var widgets = require('@jupyter-widgets/base');
var ipydatawidgets = require('jupyter-dataserializers');
var _yt_tools = import('@data-exp-lab/yt-tools');
var _ = require('lodash');

var CMapModel = widgets.WidgetModel.extend({

    defaults: function() {
        return _.extend(widgets.WidgetModel.prototype.defaults.call(this), {
            _model_name: 'CMapModel',
            _model_module: '@data-exp-lab/yt-widgets',
            _model_module_version: '0.2.0',

            cmaps: undefined,
            map_name: null,
            is_log: undefined,
            min_val: undefined, 
            max_val: undefined,
            generation: undefined
        });
    },

    initialize: function() {
        widgets.WidgetModel.prototype.initialize.apply(this, arguments);
        this.map_name = this.get('map_name');
        this.is_log = this.get('is_log');
        this.min_val = this.get('min_val');
        this.max_val = this.get('max_val');
        this.generation = this.get('generation');
        this.data_array = null;
        this.image_array = null;

        this.setupListeners();
    },

    normalize: function() {return _yt_tools.then(function(yt_tools) {
        // normalizes a given buffer with a colormap name. Requires colormaps
        // to be loaded in to wasm, so requires add_mpl_colormaps to be called 
        // at this time.
        //
        var colormaps = this.get_cmaps(yt_tools);
        colormaps.normalize(this.map_name, this.data_array, 
          this.image_array, this.min_val, this.max_val, this.is_log);
        // I sort of feel like this next line shouldn't be required if we 
        // update the Python side, but whatever. 
        // Updates the js side of image_array to our result. 
        //this.image_array = array;

        // this sync isn't working yet, so on the python side we can't 
        // access it. 
        // However, in order for the FRB to pick up that something changed 
        // in the image array, this.set must be used.  
        this.generation = this.generation + 1;
        this.set('generation', this.generation);
        this.save_changes();
        return this.image_array;
    }.bind(this)) },

    get_cmaps: function(yt_tools) {
        // initializes the wasm colormaps module from yt tools and adds the 
        // arrays stored in the self.cmaps dict on the python side into
        // the colormaps object in wasm.
        
        if (this.colormaps) {
            return this.colormaps
        } else {
            this.colormaps = new yt_tools.ColormapCollection();
    
            var mpl_cmap_obj = this.get('cmaps');
            for (var mapname in mpl_cmap_obj) {
                if (mpl_cmap_obj.hasOwnProperty(mapname)) {
                    var maptable = mpl_cmap_obj[mapname];
                    this.colormaps.add_colormap(mapname, maptable);
                }
            }
            return this.colormaps
        }
    }, 
    
    setupListeners: function() {
        
        // setting up listeners on the python side.
        this.on('change:map_name', this.name_changed, this);
        this.on('change:is_log', this.scale_changed, this);
        this.on('change:min_val', this.limits_changed, this);
        this.on('change:max_val', this.limits_changed, this);
    },

    name_changed: function() {
        var old_name = this.map_name;
        this.map_name = this.get('map_name');
        this.normalize();
    },
    
    scale_changed: function() {
        var old_scale = this.is_log;
        this.is_log = this.get('is_log');
        this.normalize();
    },
    
    limits_changed: function() {
        this.min_val = this.get('min_val');
        this.max_val = this.get('max_val');
        this.normalize();
    },

    property_changed: function() {
        this.normalize();
    },
    
    jsdata_changed: function() {
        this.normalize();
    },
}, {
    model_module: '@data-exp-lab/yt-widgets',
    model_name: 'CMapModel',
    model_module_version: '0.2.0',
});

module.exports = {
    CMapModel : CMapModel,
};
