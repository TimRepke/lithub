import {rebind, webglBaseAttribute} from 'd3fc';
import type {TypedArray} from "apache-arrow/interfaces";
import type {ProgramBuilder, WebGLBaseAttribute} from "@/plugins/scattr/types";

export default () => {
  const base: WebGLBaseAttribute = webglBaseAttribute();
  let data: Array<TypedArray> = [];
  let previousData: Array<TypedArray> | null = null;
  let maxByteLength: number = 0;

  const streamingAttribute = (programBuilder: ProgramBuilder) => {
    base(programBuilder);

    const gl = programBuilder.context();
    gl.bindBuffer(gl.ARRAY_BUFFER, base.buffer());

    if (previousData == null) {
      gl.bufferData(gl.ARRAY_BUFFER, maxByteLength, gl.DYNAMIC_DRAW);
      previousData = [];
    }

    let offset = 0;
    let remainingInvalid = false;
    for (let i = 0; i < data.length; i++) {
      if (previousData[i] == null || data[i].byteLength !== previousData[i].byteLength) {
        remainingInvalid = true;
      }
      if (remainingInvalid || data[i] !== previousData[i]) {
        gl.bufferSubData(gl.ARRAY_BUFFER, offset, data[i]);
      }
      offset += data[i].byteLength;
    }
    previousData = data.slice(0);
  };

  streamingAttribute.clear = () => {
    base.buffer(null);
    previousData = null;
  };

  streamingAttribute.maxByteLength = (...args: number[]) => {
    if (!args.length) {
      return maxByteLength;
    }
    maxByteLength = args[0];
    previousData = null;
    return streamingAttribute;
  };

  streamingAttribute.data = (...args: TypedArray[][]) => {
    if (!args.length) {
      return data;
    }
    data = args[0];
    return streamingAttribute;
  };

  rebind(streamingAttribute, base, 'type', 'size', 'normalized', 'location', 'divisor', 'stride', 'offset');

  return streamingAttribute;
};
