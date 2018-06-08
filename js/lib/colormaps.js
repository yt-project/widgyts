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
            min_val: undefined, 
            max_val: undefined,
            data_array: undefined, 
            image_array: undefined,
        });
    },

    initialize: function() {
        this.map_name = this.get('map_name');
        this.is_log = this.get('is_log');
        this.min_val = this.get('min_val');
        this.max_val = this.get('max_val');
        this.data_array = this.get('data_array').data;
        this.image_array = this.get('image_array').data;
        
        widgets.WidgetModel.prototype.initialize.apply(this, arguments);
        console.log('initializing colormaps object in WASM');
        console.log(this.data_array);

        console.log('setting up listeners');
        this.setupListeners();
        console.log('listeners done');
    },

    normalize: function() {
        // normalizes a given buffer with a colormap name. Requires colormaps
        // to be loaded in to wasm, so requires add_mpl_colormaps to be called 
        // at this time.
        //
        var that = this;
        return this.get_cmaps().then(function(colormaps) {
            if (that.min_val) {
                if (that.max_val) {
                    console.log('both min and max are user defined');
                    array = colormaps.normalize_min_max(that.map_name, that.data_array, 
                            that.min_val, that.max_val, that.is_log);
                } else {
                    console.log('min val defined, max val not defined');
                    array = colormaps.normalize_min(that.map_name, that.data_array, 
                            that.min_val, that.is_log);
                }
            } else if (that.max_val) {
                console.log('max val defined, min val not defined');
                array = colormaps.normalize_max(that.map_name, that.data_array, 
                        that.max_val, that.is_log);
            } else {
                console.log('neither max nor min defined');
                array = colormaps.normalize(that.map_name, that.data_array, that.is_log);
            };

            // checking to see that the returned array and the data object 
            // are as expected. 
            console.log(that.data_array);
            console.log(array);
            
            // I sort of feel like this next line shouldn't be required if we 
            // update the Python side, but whatever. 
            // Updates the js side of image_array to our result. 
            that.image_array = array;

            // this sync isn't working yet, so on the python side we can't 
            // access it. 
            // However, in order for the FRB to pick up that something changed 
            // in the image array, that.set must be used.  
            that.set('image_array', array).data;
            that.save_changes();
            return array
        }.bind(this));
    },

    get_cmaps: function() {
        // initializes the wasm colormaps module from yt tools and adds the 
        // arrays stored in the self.cmaps dict on the python side into
        // the colormaps object in wasm.
        
        var that = this
        return yt_tools.booted.then(function(yt_tools) {
            console.log('checking to see if colormaps object for wasm exists..... ');
            if (that.colormaps) {
                console.log('colormaps exist');
                console.log(that.colormaps);
                return that.colormaps
            } else {
                console.log('colormaps DO NOT exist..... importing....... ');
                that.colormaps = yt_tools.Colormaps.new();
        
                var mpl_cmap_obj = that.get('cmaps');
                console.log("imported the following maps:", Object.keys(mpl_cmap_obj));
                for (var mapname in mpl_cmap_obj) {
                    if (mpl_cmap_obj.hasOwnProperty(mapname)) {
                        var maptable = mpl_cmap_obj[mapname];
                        that.colormaps.add_colormap(mapname, maptable);
                    }
                }
                return that.colormaps
            }
        });
    }, 
    
    setupListeners: function() {
        console.log('in setup_listeners function');
        
        // setting up listeners on the python side.
        this.on('change:map_name', this.name_changed, this);
        this.on('change:is_log', this.scale_changed, this);
        this.on('change:min_val', this.limits_changed, this);
        this.on('change:max_val', this.limits_changed, this);
        this.on('change:data_array', this.property_changed, this);

        // setting up js listener for change in the input data array since
        // the js side of the frb and the image canvas modify it. 
        this.listenTo(this, 'change:data_array', this.jsdata_changed(), this);
    },

    name_changed: function() {
        var old_name = this.map_name;
        this.map_name = this.get('map_name');
        console.log('triggered name event listener: name from %s to %s', old_name, this.map_name);
        // console.log(this.map_name, this.is_log, this.min_val, this.max_val); 
        return this.normalize().then(function(array){
            return array;
        });
    },
    
    scale_changed: function() {
        var old_scale = this.is_log;
        this.is_log = this.get('is_log');
        console.log('triggered scale event listener: log from %s to %s', old_scale, this.is_log);
        // console.log(this.map_name, this.is_log, this.min_val, this.max_val); 
        return this.normalize().then(function(array){
            this.image_array = array;
            return array;
        }.bind(this));
    },
    
    limits_changed: function() {
        this.min_val = this.get('min_val');
        this.max_val = this.get('max_val');
        console.log('triggered limit event listener: min and max val', this.min_val, this.max_val);
        return this.normalize().then(function(array){
            return array;
        });
    },

    property_changed: function() {
        this.data = this.get('data').data;
        console.log('detected change in buffer array on python side. Renormalizing');
        return this.normalize().then(function(array){
            return array;
        });
    },
    
    jsdata_changed: function() {
        console.log(this.data);
        console.log('detected change in buffer array on js side. Renormalizing');
        return this.normalize().then(function(array){
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
