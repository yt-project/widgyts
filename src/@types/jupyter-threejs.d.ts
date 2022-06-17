
declare module "jupyter-threejs" {
    import { DOMWidgetModel, DOMWidgetView } from "@jupyter-widgets/base";
    export class BlackboxModel extends DOMWidgetModel { }
    export class RenderableModel extends DOMWidgetModel {
        _findView(): Promise<RenderableView>;
    }
    export class RenderableView extends DOMWidgetView {
        model: RenderableModel;
        updateSize(): void;
    }
}
