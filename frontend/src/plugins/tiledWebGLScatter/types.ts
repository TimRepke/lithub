import type { Float32, Uint16, Int8, Uint64 , Utf8} from 'apache-arrow';
import type { BufferAttribute } from 'three/src/core/BufferAttribute';
import type { InterleavedBufferAttribute } from 'three/src/core/InterleavedBufferAttribute';
import type * as THREE from 'three';

export enum MaterialType {
  POINT,
  SHADER,
}
export type Material = THREE.ShaderMaterial | THREE.PointsMaterial;
// export type Material = THREE.PointsMaterial;

export interface TileReference {
  depth: number;
  coord0: number;
  coord1: number;
}

export interface Extent {
  x: [number, number];
  y: [number, number];
}

export type Color = [number, number, number];
export type ColorMap = Record<number, THREE.Color>;

export interface TileMetadata {
  extent: Extent;
  children: string[];
  total_points: number;
  tile_size: number;
}

export type FeatherSchema = {
  ix: Uint64,
  title: Utf8,
  year: Uint16,
  x: Float32,
  y: Float32,
  label_0: Int8,
  label_1: Int8,
  label_2: Int8,
  label_3: Int8,
  label_4: Int8,
  label_5: Int8,
  label_6: Int8,
  label_7: Int8,
}

export interface PointsAttributes {
  size: BufferAttribute | InterleavedBufferAttribute;
  color: BufferAttribute | InterleavedBufferAttribute;
  position: BufferAttribute | InterleavedBufferAttribute;
}

export type MouseEventCallback = (key: string, ix: number) => void;
export type Points = THREE.Points<THREE.BufferGeometry, Material>;
export type PointReference = { points: Points, ix: number };