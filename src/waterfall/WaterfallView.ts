// @ts-nocheck
import * as echarts from "echarts/lib/echarts";
import * as zrUtil from "zrender/src/core/util";
import Path from "zrender/lib/graphic/Path";
import * as graphic from "../util/graphic";

echarts.extendChartView({
  type: "waterfall",

  render: function (seriesModel, ecModel, api) {
    seriesModel.pipelineContext.large ? null : this._renderNormal(seriesModel);
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
    const isSimpleBox = data.getLayout("isSimpleBox");

    if (!this._data) {
      group.removeAll();
    }

    data
      .diff(oldData)
      .add(function (newIdx) {
        if (data.hasValue(newIdx)) {
          const itemLayout = data.getItemLayout(newIdx);
          const el = createNormalBox(itemLayout, newIdx, true);
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
          setBoxCommon(el, data, newIdx, isSimpleBox);
          group.add(el);
          data.setItemGraphicEl(newIdx, el);
        }
      })
      .update(function (newIdx, oldIdx) {
        debugger; // при ресазе меняется только один столбик!
        let el = oldData.getItemGraphicEl(oldIdx) as NormalBoxPath;
        if (!data.hasValue(newIdx)) {
          group.remove(el);
          return;
        }
        const itemLayout = data.getItemLayout(newIdx);
        if (!el) {
          el = createNormalBox(itemLayout, newIdx);
        } else {
          graphic.updateProps(
            el,
            {
              shape: {
                points: itemLayout.ends,
              },
            },
            seriesModel,
            newIdx
          );
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

export function initProps(
  el: any,
  props: any,
  animatableModel?: any,
  dataIndex?: any,
  cb?: any,
  during?: any
) {
  animateOrSetProps("enter", el, props, animatableModel, dataIndex, cb, during);
}

function animateOrSetProps<Props>(
  animationType: "enter" | "update" | "leave",
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

  const isRemove = animationType === "leave";

  if (!isRemove) {
    // Must stop the remove animation.
    el.stopAnimation("leave");
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

    isFrom
      ? el.animateFrom(props, animateConfig)
      : el.animateTo(props, animateConfig);
  } else {
    el.stopAnimation();
    // If `isFrom`, the props is the "from" props.
    !isFrom && el.attr(props);
    // Call during at least once.
    during && during(1);
    cb && (cb as AnimateOrSetPropsOption["cb"])();
  }
}

function createNormalBox(itemLayout, dataIndex, isInit) {
  const ends = itemLayout.ends;
  const res = new NormalBoxPath({
    shape: {
      points: isInit ? transInit(ends, itemLayout) : ends,
    },
    z2: 100,
  });
  return res;
}

class NormalBoxPath extends Path<any> {
  readonly type = "normalWaterfallBox";
  shape;
  __simpleBox: boolean;
  constructor(opts?: any) {
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
    } else {
      ctx.moveTo(ends[0][0], ends[0][1]);
      ctx.lineTo(ends[1][0], ends[1][1]);
      ctx.lineTo(ends[2][0], ends[2][1]);
      ctx.lineTo(ends[3][0], ends[3][1]);
      ctx.closePath();

      // ctx.moveTo(ends[4][0], ends[4][1]);
      // ctx.lineTo(ends[5][0], ends[5][1]);
      // ctx.moveTo(ends[6][0], ends[6][1]);
      // ctx.lineTo(ends[7][0], ends[7][1]);
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
  const visual = data.getItemVisual(dataIndex, "style");
  el.useStyle(visual);
  el.style.strokeNoScale = true;
  el.__simpleBox = isSimpleBox;
  setStatesStylesFromModel(el, itemModel);
}

const OTHER_STATES = ["emphasis", "blur", "select"];
const defaultStyleGetterMap: any = {
  itemStyle: "getItemStyle",
  lineStyle: "getLineStyle",
  areaStyle: "getAreaStyle",
};
export function setStatesStylesFromModel(
  el,
  itemModel,
  styleType?: string,
  getter?: (model) => any
) {
  styleType = styleType || "itemStyle";
  for (let i = 0; i < OTHER_STATES.length; i++) {
    const stateName = OTHER_STATES[i];
    const model = itemModel.getModel([stateName, styleType]);
    const state = el.ensureState(stateName);
    state.style = getter
      ? getter(model)
      : model[defaultStyleGetterMap[styleType]]();
  }
}
