import type { MP4Sample } from 'mp4box'


export type ExtMP4Sample = Omit<MP4Sample, 'data'> & {
  is_idr: boolean;
  deleted?: boolean;
  data: null | Uint8Array;
};