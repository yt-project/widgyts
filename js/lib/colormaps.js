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
            map_name: null,
            is_log: undefined,
            data: undefined, 
            image_array: undefined,
        });
    },

    initialize: function() {
        this.map_name = this.get('map_name');
        this.is_log = this.get('is_log');
        this.data = this.get('data');
        this.image_array = this.get('image_array');
        
        widgets.WidgetModel.prototype.initialize.apply(this, arguments);
        console.log('initializing colormaps object in WASM');

        console.log('setting up listeners');
        this.setupListeners();
        console.log('listeners done');
        
        // this.initPromise = this.boot_tools().then(function() {
        //     console.log('setting up listeners');
        //     this.setupListeners();
        //     console.log('listeners done');
        // }.bind(this));
    },

    boot_tools: function() {
        return yt_tools.booted.then(function(yt_tools) {
            return yt_tools;
        }.bind(this));
    },

    normalize: function(name, buffer, take_log) {
        // normalizes a given buffer with a colormap name. Requires colormaps
        // to be loaded in to wasm, so requires add_mpl_colormaps to be called 
        // at this time.
        // this.set('image_array', [1.0]);
        //this.save_changes();
        var that = this;
        return this.add_mpl_colormaps_to_wasm().then(function(colormaps) {
            array = colormaps.normalize(name, buffer, take_log);
            console.log(array);
            that.set('image_array', array);
            that.save_changes();
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
    
    setupListeners: function() {
        console.log('in setup_listeners function');
        this.on('change:map_name', this.name_changed, this);
        this.on('change:is_log', this.scale_changed, this);
        this.on('change:data', this.property_changed, this);
    },

    name_changed: function() {
        var old_name = this.map_name;
        this.map_name = this.get('map_name');
        console.log('triggered name event listener: name from %s to %s', old_name, this.map_name);
        return this.normalize(this.map_name, this.data, this.is_log).then(function(array){
            console.log(array);
            return array;
        });
    },
    
    scale_changed: function() {
        var old_scale = this.is_log;
        this.is_log = this.get('is_log');
        console.log('triggered scale event listener: log from %s to %s', old_scale, this.is_log);
        return this.normalize(this.map_name, this.data, this.is_log).then(function(array){
            console.log(array);
            return array;
        });
    },

    property_changed: function() {
        this.data = this.get('data');
        console.log('detected change in buffer array. Renormalizing');
        return this.normalize(this.map_name, this.data, this.is_log).then(function(array){
            console.log(array);
            return array;
        });
    },
}, {
   serializers: _.extend({
       data: ipydatawidgets.data_union_array_serialization,
       image_array: ipydatawidgets.data_union_array_serialization
   }, widgets.WidgetModel.serializers),
}, {
    model_module: 'yt-jscanvas',
    model_name: 'CMapModel',
    model_module_version: '0.1.0',
});

module.exports = {
    CMapModel : CMapModel,
};
