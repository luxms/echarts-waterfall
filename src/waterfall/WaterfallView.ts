// @ts-nocheck
import * as echarts from 'echarts/lib/echarts';
import * as zrUtil from 'zrender/src/core/util';
import Path, { PathProps } from 'zrender/src/graphic/Path';


// Расширяет класс ChartView
// к существующим полям, например group, можно обращаться по this
//  
// type: string;
// readonly group: ViewRootGroup;
// readonly uid: string;
// readonly renderTask: SeriesTask;
// render(seriesModel: SeriesModel, ecModel: GlobalModel, api: ExtensionAPI, payload: Payload): void;
// dispose(ecModel: GlobalModel, api: ExtensionAPI): void;
// updateView(seriesModel: SeriesModel,ecModel: GlobalModel, api: ExtensionAPI, payload: Payload): void;
// updateLayout(seriesModel: SeriesModel, ecModel: GlobalModel, api: ExtensionAPI, payload: Payload): void;
// updateVisual(seriesModel: SeriesModel, ecModel: GlobalModel, api: ExtensionAPI, payload: Payload): void;
// eachRendered(cb: (el: Element) => boolean | void): void;
//
// SeriesModel - модель серии
// ecModel (GlobalModel): init / setOption / resetOption / getComponent / eachComponent / etc.
// --------------------------------
echarts.extendChartView({ 
  type: 'waterfall',

  // Функция рендера, приходим сюда уже после layout
  render: function (seriesModel, ecModel, api) {
    const group = this.group;
    group.removeAll(); // непонятно зачем, но наверное надо
    group.removeClipPath(); // или это?? или оба
    const data = seriesModel.getData();
    const isSimpleBox = data.getLayout('isSimpleBox');

    // data.each(function(idx) {
    //   // Идем по каждому столбику и видимо можно использовать что-то отсюда:
    //   // setItemGraphicEl / setItemVisual
    //   const model = data.getItemModel(idx);
    //   const itemLayout = data.getItemLayout(idx);

    //   // тут рисуем столбик
    //   const el = createNormalBox(itemLayout, idx, true);
    //   // тут что-то с анимацией
    //   // graphic.initProps(el, {shape: {points: itemLayout.ends}}, seriesModel, idx);
    //   setBoxCommon(el, data, idx, isSimpleBox);
    //   // тут сеттим столбик
    //   group.add(el);
    //   data.setItemGraphicEl(idx, el);
    //   debugger;
    // })

    // seriesModel.layoutInstance.ondraw = function(param) {
    //   console.log(param)
    // }
    // фигня из candlestick тоже не работает по похожим причинам
    this._renderNormal(seriesModel);
  },

  remove: function () {
    this.group.removeAll();
    this._model.layoutInstance.dispose();
  },

  dispose: function () {
    this._model.layoutInstance.dispose();
  },

  _renderNormal(seriesModel) {
    const data = seriesModel.getData();
    const oldData = this._data;
    const group = this.group;
    const isSimpleBox = data.getLayout('isSimpleBox');

    const needsClip = seriesModel.get('clip', true);
    const coord = seriesModel.coordinateSystem;
    const clipArea = coord.getArea && coord.getArea();
    debugger;

    data.diff(oldData)
      .add(function (newIdx) {
        if (data.hasValue(newIdx)) {
            // const itemLayout = data.getItemLayout(newIdx) as CandlestickItemLayout;
            const itemLayout = {"sign":1,"initBaseline":345,"ends":[[230.5,212],[383.5,212],[383.5,345],[230.5,345],[306.5,174],[306.5,212],[306.5,440],[306.5,345]],"brushRect":{"x":230.40000000000003,"y":440,"width":153.60000000000002,"height":-266}};

            if (needsClip && isNormalBoxClipped(clipArea, itemLayout)) {
                return;
            }

            const el = createNormalBox(itemLayout, newIdx, true);

            setBoxCommon(el, data, newIdx, isSimpleBox);

            group.add(el);

            data.setItemGraphicEl(newIdx, el);
        }
    })
        .update(function (newIdx, oldIdx) {
            let el = oldData.getItemGraphicEl(oldIdx) as NormalBoxPath;

            // Empty data
            if (!data.hasValue(newIdx)) {
                group.remove(el);
                return;
            }

            const itemLayout = data.getItemLayout(newIdx) as CandlestickItemLayout;
            if (needsClip && isNormalBoxClipped(clipArea, itemLayout)) {
                group.remove(el);
                return;
            }

            if (!el) {
                el = createNormalBox(itemLayout, newIdx);
            }
            else {
                graphic.updateProps(el, {
                    shape: {
                        points: itemLayout.ends
                    }
                }, seriesModel, newIdx);

                saveOldStyle(el);
            }

            setBoxCommon(el, data, newIdx, isSimpleBox);

            group.add(el);
            data.setItemGraphicEl(newIdx, el);
        })
        .remove(function (oldIdx) {
            const el = oldData.getItemGraphicEl(oldIdx);
            el && group.remove(el);
        })
        .execute();

    this._data = data;
}
});

function isNormalBoxClipped(clipArea: any, itemLayout: any) {
  let clipped = true;
  for (let i = 0; i < itemLayout.ends.length; i++) {
      // If any point are in the region.
      if (clipArea.contain(itemLayout.ends[i][0], itemLayout.ends[i][1])) {
          clipped = false;
          break;
      }
  }
  return clipped;
}

export function initProps(
  el: any,
  props: any,
  animatableModel?: any,
  dataIndex?: any,
  cb?: any,
  during?: any
) {
  animateOrSetProps('enter', el, props, animatableModel, dataIndex, cb, during);
}

function animateOrSetProps<Props>(
  animationType: 'enter' | 'update' | 'leave',
  el: any,
  props: any,
  animatableModel?: any,
  dataIndex?: any,
  cb?: any,
  during?: any
) {
  let isFrom = false;
  let removeOpt: any;
  if (isFunction(dataIndex)) {
      during = cb;
      cb = dataIndex;
      dataIndex = null;
  }
  else if (isObject(dataIndex)) {
      cb = dataIndex.cb;
      during = dataIndex.during;
      isFrom = dataIndex.isFrom;
      removeOpt = dataIndex.removeOpt;
      dataIndex = dataIndex.dataIndex;
  }

  const isRemove = (animationType === 'leave');

  if (!isRemove) {
      // Must stop the remove animation.
      el.stopAnimation('leave');
  }

  const animationConfig = getAnimationConfig(
    animationType,
    animatableModel,
    dataIndex as number,
    isRemove ? (removeOpt || {}) : null,
    (animatableModel && animatableModel.getAnimationDelayParams)
        ? animatableModel.getAnimationDelayParams(el, dataIndex as number)
        : null
);
if (animationConfig && animationConfig.duration > 0) {
    const duration = animationConfig.duration;
    const animationDelay = animationConfig.delay;
    const animationEasing = animationConfig.easing;

    const animateConfig: ElementAnimateConfig = {
        duration: duration as number,
        delay: animationDelay as number || 0,
        easing: animationEasing,
        done: cb,
        force: !!cb || !!during,
        // Set to final state in update/init animation.
        // So the post processing based on the path shape can be done correctly.
        setToFinal: !isRemove,
        scope: animationType,
        during: during
    };

    isFrom
        ? el.animateFrom(props, animateConfig)
        : el.animateTo(props, animateConfig);
}
else {
    el.stopAnimation();
    // If `isFrom`, the props is the "from" props.
    !isFrom && el.attr(props);
    // Call during at least once.
    during && during(1);
    cb && (cb as AnimateOrSetPropsOption['cb'])();
}
}

function createNormalBox(itemLayout: CandlestickItemLayout, dataIndex: number, isInit?: boolean) {
  const ends = itemLayout.ends;
  return new NormalBoxPath({
      shape: {
          points: isInit
              ? transInit(ends, itemLayout)
              : ends
      },
      z2: 100
  });
}

class NormalBoxPath extends Path<NormalBoxPathProps> {
  readonly type = 'normalCandlestickBox';
  shape;
  __simpleBox: boolean;
  constructor(opts?: NormalBoxPathProps) {
      super(opts);
  }
  getDefaultShape() {
      return new NormalBoxPathShape();
  }
  buildPath(ctx, shape) {
      const ends = shape.points;
      if (this.__simpleBox) {
          ctx.moveTo(ends[4][0], ends[4][1]);
          ctx.lineTo(ends[6][0], ends[6][1]);
      }
      else {
          ctx.moveTo(ends[0][0], ends[0][1]);
          ctx.lineTo(ends[1][0], ends[1][1]);
          ctx.lineTo(ends[2][0], ends[2][1]);
          ctx.lineTo(ends[3][0], ends[3][1]);
          ctx.closePath();

          ctx.moveTo(ends[4][0], ends[4][1]);
          ctx.lineTo(ends[5][0], ends[5][1]);
          ctx.moveTo(ends[6][0], ends[6][1]);
          ctx.lineTo(ends[7][0], ends[7][1]);
      }
  }
}

class NormalBoxPathShape {
  points: number[][];
}

function transInit(points: number[][], itemLayout) {
  return zrUtil.map(points, function (point) {
      point = point.slice();
      point[1] = itemLayout.initBaseline;
      return point;
  });
}

function setBoxCommon(el, data, dataIndex: number, isSimpleBox?: boolean) {
  const itemModel = data.getItemModel(dataIndex);
  el.useStyle(data.getItemVisual(dataIndex, 'style'));
  el.style.strokeNoScale = true;
  el.__simpleBox = isSimpleBox;
  setStatesStylesFromModel(el, itemModel);
}

const OTHER_STATES = ['emphasis', 'blur', 'select'];
const defaultStyleGetterMap: any = {
  itemStyle: 'getItemStyle',
  lineStyle: 'getLineStyle',
  areaStyle: 'getAreaStyle'
};
export function setStatesStylesFromModel(
  el,
  itemModel,
  styleType?: string, // default itemStyle
  getter?: (model) => any
) {
  styleType = styleType || 'itemStyle';
  for (let i = 0; i < OTHER_STATES.length; i++) {
      const stateName = OTHER_STATES[i];
      const model = itemModel.getModel([stateName, styleType]);
      const state = el.ensureState(stateName);
      state.style = getter ? getter(model) : model[defaultStyleGetterMap[styleType]]();
  }
}