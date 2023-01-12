export interface ProgramBuilder {

  vertexShader(): WebGLShader;

  vertexShader(x: WebGLShader): ProgramBuilder;

  fragmentShader(): WebGLShader;

  fragmentShader(x: WebGLShader): ProgramBuilder;

  context(): WebGLRenderingContext;

  context(x: WebGLRenderingContext): ProgramBuilder;

  mode(): number;

  mode(x: number): ProgramBuilder; // https://github.com/d3fc/d3fc/blob/master/packages/d3fc-webgl/src/program/drawModes.js

  subInstanceCount(): number;

  subInstanceCount(x: number): ProgramBuilder;

  debug(): boolean;

  debug(x: boolean): ProgramBuilder;

  pixelRatio(): number;

  pixelRatio(x: number): ProgramBuilder;

  (count: number): void;
}

export type BufferBuilderAttributesValue = any;
export type BufferBuilderAttributes = Record<string, BufferBuilderAttributesValue>;
export type BufferBuilderUniformValue = any;
export type BufferBuilderUniform = Record<string, BufferBuilderUniformValue>;

export interface BufferBuilder {
  flush(): void;

  attribute(key: string): BufferBuilderAttributesValue;

  attribute(key: string, value: any): BufferBuilder;

  uniform(key: string): BufferBuilderUniformValue;

  uniform(key: string, value: any): BufferBuilder;

  elementIndices(): any;

  elementIndices(x: any): BufferBuilder;

  (programBuilder: ProgramBuilder, program: WebGLProgram): BufferBuilder;
}

export interface WebGLBaseAttribute {
  location(): GLint;

  location(x: GLint): WebGLBaseAttribute;

  size(): number;

  size(x: number): WebGLBaseAttribute;

  type(): number;

  type(x: number): WebGLBaseAttribute;

  normalized(): boolean;

  normalized(x: boolean): WebGLBaseAttribute;

  stride(): number;

  stride(x: number): WebGLBaseAttribute;

  offset(): number;

  offset(x: number): WebGLBaseAttribute;

  divisor(): number | null;

  divisor(x: number | null): WebGLBaseAttribute;

  buffer(): WebGLBuffer | null;

  buffer(x: WebGLBuffer | null): WebGLBaseAttribute;

  (programBuilder: ProgramBuilder): void;
}

export interface ConstantAttribute {
  clear(): void;

  value(): any;

  value(x: any): ConstantAttribute;

  rebind(constantAttribute: ConstantAttribute, base: WebGLBaseAttribute, ...names: string[])

  (programBuilder: ProgramBuilder): void;
}


export type MetaData = {
  extent: { x: [number, number], y: [number, number] };
  total_points: number;
  schemes: Record<number, { scheme_id: number, column: string, label: number, choices: Array<string>, description: string }>;
}