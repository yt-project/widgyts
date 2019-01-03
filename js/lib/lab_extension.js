var yt_widgets = require('./index');
var base = require('@jupyter-widgets/base');

module.exports = {
  id: '@data-exp-lab/yt-widgets',
  requires: [base.IJupyterWidgetRegistry],
  activate: function(app, widgets) {
      widgets.registerWidget({
          name: '@data-exp-lab/yt-widgets',
          version: yt_widgets.version,
          exports: yt_widgets
      });
  },
  autoStart: true
};
