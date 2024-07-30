// @ts-nocheck
import { ChartView, graphic } from 'echarts/lib/echarts';
import * as zrUtil from 'zrender/lib/core/util';
import Path from 'zrender/lib/graphic/Path';
import { getDefaultLabel, getDefaultInterpolatedLabel } from 'echarts/lib/chart/helper/labelHelper';
import { setLabelStyle, getLabelStatesModels, setLabelValueAnimation, labelInner } from 'echarts/lib/label/labelStyle';
import { toggleHoverEmphasis } from 'echarts/lib/util/states';

const WaterfallView = ChartView.extend({
  type: 'waterfall',

  render: function (seriesModel) {
    this._renderNormal(seriesModel);
  },

  remove: function () {
    this.group.removeAll();
  },

  _renderNormal(seriesModel) {
    const data = seriesModel.getData();
    const oldData = this._data;
    const group = this.group;
    const isSimpleBox = data.getLayout('isSimpleBox');
    const septum = seriesModel.get('septum', true);

    const needsClip = seriesModel.get('clip', true);
    const coord = seriesModel.coordinateSystem;
    const clipArea = coord.getArea && coord.getArea();

    if (!this._data) {
      group.removeAll();
    }

    data
      .diff(oldData)
      .add(function (newIdx) {
        if (data.hasValue(newIdx)) {
          const itemLayout = data.getItemLayout(newIdx);
          const nextItemLayout = data.getItemLayout(newIdx + 1);

          if (needsClip && isNormalBoxClipped(clipArea, itemLayout)) {
            return;
          }

          // const el = createNormalBox(itemLayout, newIdx, true);
          const elGroup = new graphic.Group();

          const el = new NormalBoxPath({
            shape: {
              points: itemLayout.ends,
            },
            z2: 100,
          });

          graphic.initProps(
            el,
            {
              shape: {
                points: itemLayout.ends,
              },
            },
            seriesModel,
            newIdx
          );

          elGroup.add(el);

          setBoxCommon(el, data, newIdx, isSimpleBox);

          if (nextItemLayout && septum.show) {
            const line = new graphic.Line({
              shape: {
                x1: itemLayout.ends[4][0],
                y1: itemLayout.ends[4][1],
                x2: itemLayout.ends[5][0],
                y2: itemLayout.ends[5][1],
              },
              silent: true,
              style: {
                lineDash: septum.dashed ? [3] : null,
                stroke: '#9C9C9C',
              },
            });
            graphic.initProps(
              line,
              {
                shape: {
                  x1: itemLayout.ends[4][0],
                  y1: itemLayout.ends[4][1],
                  x2: itemLayout.ends[5][0],
                  y2: itemLayout.ends[5][1],
                },
              },
              seriesModel,
              newIdx
            );
            elGroup.add(line);
          }

          const style = data.getItemVisual(newIdx, 'style');
          const itemModel = data.getItemModel(newIdx);
          const labelStatesModels = getLabelStatesModels(itemModel);

          setLabelStyle(el, labelStatesModels, {
            labelFetcher: seriesModel,
            labelDataIndex: newIdx,
            defaultText: getDefaultLabel(data, newIdx),
            inheritColor: style.fill,
            defaultOpacity: style.opacity,
            defaultOutsidePosition: false,
          });

          const labelEl = el.getTextContent();

          setLabelValueAnimation(labelEl, labelStatesModels, seriesModel.getRawValue(newIdx), (value: number) =>
            getDefaultInterpolatedLabel(data, value)
          );

          el.useStyle(style);
          const emphasisModel = itemModel.getModel(['emphasis']);
          setStatesStylesFromModel(el, itemModel);

          toggleHoverEmphasis(
            el,
            emphasisModel.get('focus'),
            emphasisModel.get('blurScope'),
            emphasisModel.get('disabled')
          );

          group.add(elGroup);
          data.setItemGraphicEl(newIdx, elGroup);
        }
      })
      .update(function (newIdx, oldIdx) {
        let el = oldData.getItemGraphicEl(oldIdx);
        const [box, line] = el?.children();

        if (!data.hasValue(newIdx)) {
          group.remove(el);
          return;
        }

        const itemLayout = data.getItemLayout(newIdx);

        if (needsClip && isNormalBoxClipped(clipArea, itemLayout)) {
          group.remove(el);
          return;
        }

        if (!el) {
          el = createNormalBox(itemLayout, newIdx);
        } else {
          graphic.updateProps(
            box,
            {
              shape: {
                points: itemLayout.ends,
              },
            },
            seriesModel,
            newIdx
          );
          if (line) {
            graphic.updateProps(
              line,
              {
                shape: {
                  x1: itemLayout.ends[4][0],
                  y1: itemLayout.ends[4][1],
                  x2: itemLayout.ends[5][0],
                  y2: itemLayout.ends[5][1],
                },
              },
              seriesModel,
              newIdx
            );
          }

          const style = data.getItemVisual(newIdx, 'style');
          const itemModel = data.getItemModel(newIdx);
          const labelStatesModels = getLabelStatesModels(itemModel);

          setLabelStyle(box, labelStatesModels, {
            labelFetcher: seriesModel,
            labelDataIndex: newIdx,
            defaultText: getDefaultLabel(seriesModel.getData(), newIdx),
            inheritColor: style.fill,
            defaultOpacity: style.opacity,
            defaultOutsidePosition: false,
          });

          box.useStyle(style);
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
  },
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

export function initProps(el: any, props: any, animatableModel?: any, dataIndex?: any, cb?: any, during?: any) {
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
  } else if (isObject(dataIndex)) {
    cb = dataIndex.cb;
    during = dataIndex.during;
    isFrom = dataIndex.isFrom;
    removeOpt = dataIndex.removeOpt;
    dataIndex = dataIndex.dataIndex;
  }

  const isRemove = animationType === 'leave';

  if (!isRemove) {
    // Must stop the remove animation.
    el.stopAnimation('leave');
  }

  const animationConfig = getAnimationConfig(
    animationType,
    animatableModel,
    dataIndex as number,
    isRemove ? removeOpt || {} : null,
    animatableModel && animatableModel.getAnimationDelayParams
      ? animatableModel.getAnimationDelayParams(el, dataIndex as number)
      : null
  );
  if (animationConfig && animationConfig.duration > 0) {
    const duration = animationConfig.duration;
    const animationDelay = animationConfig.delay;
    const animationEasing = animationConfig.easing;

    const animateConfig: ElementAnimateConfig = {
      duration: duration as number,
      delay: (animationDelay as number) || 0,
      easing: animationEasing,
      done: cb,
      force: !!cb || !!during,
      // Set to final state in update/init animation.
      // So the post processing based on the path shape can be done correctly.
      setToFinal: !isRemove,
      scope: animationType,
      during: during,
    };

    isFrom ? el.animateFrom(props, animateConfig) : el.animateTo(props, animateConfig);
  } else {
    el.stopAnimation();
    // If `isFrom`, the props is the "from" props.
    !isFrom && el.attr(props);
    // Call during at least once.
    during && during(1);
    cb && (cb as AnimateOrSetPropsOption['cb'])();
  }
}

function createNormalBox(itemLayout, dataIndex, isInit?) {
  const ends = itemLayout.ends;
  const res = new NormalBoxPath({
    shape: {
      // points: ends,
      points: isInit ? transInit(ends, itemLayout) : ends,
    },
    z2: 100,
  });
  return res;
}

class NormalBoxPath extends Path<any> {
  readonly type = 'waterfallBar';
  // public shape: object;

  constructor(opts?: any) {
    super(opts);
  }

  getDefaultShape() {
    return new NormalBoxPathShape();
  }

  buildPath(ctx, shape) {
    const ends = shape.points;
    ctx.moveTo(ends[0][0], ends[0][1]);
    ctx.lineTo(ends[1][0], ends[1][1]);
    ctx.lineTo(ends[2][0], ends[2][1]);
    ctx.lineTo(ends[3][0], ends[3][1]);
    ctx.closePath();
  }
}

class BBBPath extends Path<any> {
  readonly type = 'waterfallLine';

  constructor(opts?: any) {
    super(opts);
  }

  getDefaultShape() {
    return new NormalBoxPathShape();
  }

  buildPath(ctx, shape) {
    const ends = shape.points;
    ctx.moveTo(ends[4][0], ends[4][1]);
    ctx.lineTo(ends[5][0], ends[5][1]);
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
  // const itemModel = data.getItemModel(dataIndex);
  // el.style.strokeNoScale = true;
  // el.__simpleBox = isSimpleBox;
  // const sign = data.getItemLayout(dataIndex).sign;
  // zrUtil.each(el.states, (state: any, stateName) => {
  //   const stateModel = itemModel.getModel(stateName as any);
  //   const color = getColor(sign, stateModel);
  //   const stateStyle = state.style || (state.style = {});
  //   color && (stateStyle.fill = color);
  // });
  // setStatesStylesFromModel(el, itemModel);
}

const OTHER_STATES = ['emphasis', 'blur', 'select'];
const defaultStyleGetterMap: any = {
  itemStyle: 'getItemStyle',
  lineStyle: 'getLineStyle',
  areaStyle: 'getAreaStyle',
};
export function setStatesStylesFromModel(el, itemModel, styleType?: string, getter?: (model) => any) {
  styleType = styleType || 'itemStyle';
  for (let i = 0; i < OTHER_STATES.length; i++) {
    const stateName = OTHER_STATES[i];
    const model = itemModel.getModel([stateName, styleType]);
    const state = el.ensureState(stateName);
    state.style = getter ? getter(model) : model[defaultStyleGetterMap[styleType]]();
  }
}

const innerUniqueIndex = getRandomIdBase();
function saveOldStyle(el) {
  transitionStore(el).oldStyle = el.style;
}
function getOldStyle(el) {
  return transitionStore(el).oldStyle;
}
const transitionStore = makeInner();
function getRandomIdBase() {
  return Math.round(Math.random() * 9);
}
function makeInner() {
  const key = '__ec_inner_' + innerUniqueIndex + 1;
  return function (hostObj) {
    return hostObj[key] || (hostObj[key] = {});
  };
}

export default WaterfallView;
