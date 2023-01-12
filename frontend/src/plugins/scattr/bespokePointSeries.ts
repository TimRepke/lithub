import {scaleIdentity} from 'd3';
import type {ScaleIdentity} from 'd3';
import type {ScaleContinuousNumeric} from "d3-scale";
import {
  rebind,
  webglSeriesPoint,
  webglScaleMapper
} from 'd3fc';

import type {TypedArray} from "apache-arrow/interfaces";
import type {ConstantAttribute, ProgramBuilder} from "@/plugins/scattr/types";

//@ts-ignore
import webglConstantAttribute from '@d3fc/d3fc-webgl/src/buffer/constantAttribute';
//@ts-ignore
import circlePointShader from '@d3fc/d3fc-webgl/src/shaders/point/circle/baseShader';

export type DecorateFunction = (programBuilder: ProgramBuilder, data: TypedArray, index: number) => void;
type ScaleType = ScaleContinuousNumeric<number, number, never> | ScaleIdentity;

export default () => {
  const sizeAttribute: ConstantAttribute = webglConstantAttribute();
  const definedAttribute: ConstantAttribute = webglConstantAttribute();

  const draw = webglSeriesPoint()
    .sizeAttribute(sizeAttribute)
    .definedAttribute(definedAttribute);

  let xScale: ScaleType = scaleIdentity();
  let yScale: ScaleType = scaleIdentity();
  let size: number = 1;
  let decorate: DecorateFunction = () => {
  };

  const streamingPointSeries = (data: TypedArray) => {
    sizeAttribute.value([Math.pow(size * (window.devicePixelRatio ?? 1), 2)]);
    definedAttribute.value([true]);

    // the following assumes there is no d3 scale required
    const xWebglScale = webglScaleMapper(xScale).webglScale;
    const yWebglScale = webglScaleMapper(yScale).webglScale;

    draw.xScale(xWebglScale)
      .yScale(yWebglScale)
      .type(circlePointShader())
      .decorate((programBuilder: ProgramBuilder) => {
        decorate(programBuilder, data, 0);
      });

    draw(data.length);
  };

  streamingPointSeries.size = (...args: number[]) => {
    if (!args.length) {
      return size;
    }
    size = args[0];
    return streamingPointSeries;
  };

  streamingPointSeries.xScale = (...args: ScaleType[]) => {
    if (!args.length) {
      return xScale;
    }
    xScale = args[0];
    return streamingPointSeries;
  };

  streamingPointSeries.yScale = (...args: ScaleType[]) => {
    if (!args.length) {
      return yScale;
    }
    yScale = args[0];
    return streamingPointSeries;
  };

  streamingPointSeries.decorate = (...args: DecorateFunction[]) => {
    if (!args.length) {
      return decorate;
    }
    decorate = args[0];
    return streamingPointSeries;
  };

  // this is where the attributes are exposed to the consumer
  rebind(streamingPointSeries, draw, 'context', 'pixelRatio', 'type', 'mainValueAttribute', 'crossValueAttribute');

  return streamingPointSeries;
};
