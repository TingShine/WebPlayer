import type { ExtMP4Sample } from "@demuxer";
import { decodeChunks, sleep, videoSamples2Chunks } from "./utils";
import { CommonLog } from "../../common/log";
import type { IFileReader } from '@fetcher'

const log = new CommonLog('VideoFrameFinder')

export class VideoFrameFinder {
  #dec: VideoDecoder | null = null;
  constructor(
    public localFileReader: IFileReader,
    public samples: ExtMP4Sample[],
    public conf: VideoDecoderConfig,
  ) {}

  #ts = 0;
  #curAborter = { abort: false, st: performance.now() };
  find = async (time: number): Promise<VideoFrame | null> => {
    if (
      this.#dec == null ||
      this.#dec.state === 'closed' ||
      time <= this.#ts ||
      time - this.#ts > 3e6
    ) {
			console.log('reset')
      this.#reset(time);
    }

    this.#curAborter.abort = true;
    this.#ts = time;

    this.#curAborter = { abort: false, st: performance.now() };
    const vf = await this.#parseFrame(time, this.#dec, this.#curAborter);
    this.#sleepCnt = 0;
    return vf;
  };

  // fix VideoFrame duration is null
  #lastVfDur = 0;

  #downgradeSoftDecode = false;
  #videoDecCursorIdx = 0;
  #videoFrames: VideoFrame[] = [];
  #outputFrameCnt = 0;
  #inputChunkCnt = 0;
  #sleepCnt = 0;
  #parseFrame = async (
    time: number,
    dec: VideoDecoder | null,
    aborter: { abort: boolean; st: number },
  ): Promise<VideoFrame | null> => {
    if (dec == null || dec.state === 'closed' || aborter.abort) return null;

    if (this.#videoFrames.length > 0) {
      const vf = this.#videoFrames[0];
      if (time < vf.timestamp) return null;
      // 弹出第一帧
      this.#videoFrames.shift();
      // 第一帧过期，找下一帧
      if (time > vf.timestamp + (vf.duration ?? 0)) {
        vf.close();
        return await this.#parseFrame(time, dec, aborter);
      }

      if (this.#videoFrames.length < 10) {
        // 预解码 避免等待
        this.#startDecode(dec).catch((err) => {
          this.#reset(time);
          throw err;
        });
      }
      // 符合期望
      return vf;
    }

    // 缺少帧数据
    if (
      this.#decoding ||
      (this.#outputFrameCnt < this.#inputChunkCnt && dec.decodeQueueSize > 0)
    ) {
      if (performance.now() - aborter.st > 6e3) {
        throw Error(
          `MP4Clip.tick video timeout, ${JSON.stringify(this.#getState())}`,
        );
      }
      // 解码中，等待，然后重试
      this.#sleepCnt += 1;
      await sleep(15);
    } else if (this.#videoDecCursorIdx >= this.samples.length) {
      // decode completed
      return null;
    } else {
      try {
        await this.#startDecode(dec);
      } catch (err) {
        this.#reset(time);
        throw err;
      }
    }
    return await this.#parseFrame(time, dec, aborter);
  };

  #decoding = false;
  #startDecode = async (dec: VideoDecoder) => {
    if (this.#decoding || dec.decodeQueueSize > 600) return;

    // 启动解码任务，然后重试
    let endIdx = this.#videoDecCursorIdx + 1;
    if (endIdx > this.samples.length) return;

    this.#decoding = true;
    // 该 GoP 时间区间有时间匹配，且未被删除的帧
    let hasValidFrame = false;
    for (; endIdx < this.samples.length; endIdx++) {
      const s = this.samples[endIdx];
      if (!hasValidFrame && !s.deleted) {
        hasValidFrame = true;
      }
      // 找一个 GoP，所以是下一个 IDR 帧结束
      if (s.is_idr) break;
    }

    if (hasValidFrame) {
      const samples = this.samples.slice(this.#videoDecCursorIdx, endIdx);
      if (samples[0]?.is_idr !== true) {
        log.warn('First sample not idr frame');
      } else {
        const readStarTime = performance.now();
        const chunks = await videoSamples2Chunks(samples, this.localFileReader);

        const readCost = performance.now() - readStarTime;
        if (readCost > 1000) {
          const first = samples[0];
          const last = samples.at(-1)!;
          const rangSize = last.offset + last.size - first.offset;
          log.warn(
            `Read video samples time cost: ${Math.round(readCost)}ms, file chunk size: ${rangSize}`,
          );
        }
        // Wait for the previous asynchronous operation to complete, at which point the task may have already been terminated
        if (dec.state === 'closed') return;

        this.#lastVfDur = chunks[0]?.duration ?? 0;
        decodeChunks(dec, chunks, {
          onDecodingError: (err) => {
            if (this.#downgradeSoftDecode) {
              throw err;
            } else if (this.#outputFrameCnt === 0) {
              this.#downgradeSoftDecode = true;
              log.warn('Downgrade to software decode');
              this.#reset();
            }
          },
        });

        this.#inputChunkCnt += chunks.length;
      }
    }
    this.#videoDecCursorIdx = endIdx;
    this.#decoding = false;
  };

  #reset = (time?: number) => {
    this.#decoding = false;
    this.#videoFrames.forEach((f) => f.close());
    this.#videoFrames = [];
    if (time == null || time === 0) {
      this.#videoDecCursorIdx = 0;
    } else {
      let keyIdx = 0;
      for (let i = 0; i < this.samples.length; i++) {
        const s = this.samples[i];
        if (s.is_idr) keyIdx = i;
        if (s.cts < time) continue;
        this.#videoDecCursorIdx = keyIdx;
        break;
      }
    }
    this.#inputChunkCnt = 0;
    this.#outputFrameCnt = 0;
    if (this.#dec?.state !== 'closed') this.#dec?.close();
    const encoderConf = {
      ...this.conf,
      ...(this.#downgradeSoftDecode
        ? { hardwareAcceleration: 'prefer-software' }
        : {}),
    } as VideoDecoderConfig;
    this.#dec = new VideoDecoder({
      output: (vf) => {
        this.#outputFrameCnt += 1;
        if (vf.timestamp === -1) {
          vf.close();
          return;
        }
        let rsVf = vf;
        if (vf.duration == null) {
          rsVf = new VideoFrame(vf, {
            duration: this.#lastVfDur,
          });
          vf.close();
        }
        this.#videoFrames.push(rsVf);
      },
      error: (err) => {
        if (err.message.includes('Codec reclaimed due to inactivity')) {
          this.#dec = null;
          return;
        }

        const errMsg = `VideoFinder VideoDecoder err: ${err.message}, config: ${JSON.stringify(encoderConf)}, state: ${JSON.stringify(this.#getState())}`;
        log.error(errMsg);
        throw Error(errMsg);
      },
    });
    this.#dec.configure(encoderConf);
  };

  #getState = () => ({
    time: this.#ts,
    decState: this.#dec?.state,
    decQSize: this.#dec?.decodeQueueSize,
    decCusorIdx: this.#videoDecCursorIdx,
    sampleLen: this.samples.length,
    inputCnt: this.#inputChunkCnt,
    outputCnt: this.#outputFrameCnt,
    cacheFrameLen: this.#videoFrames.length,
    softDeocde: this.#downgradeSoftDecode,
    sleepCnt: this.#sleepCnt,
    memInfo: memoryUsageInfo(),
  });

  destroy = () => {
    if (this.#dec?.state !== 'closed') this.#dec?.close();
    this.#dec = null;
    this.#curAborter.abort = true;
    this.#videoFrames.forEach((f) => f.close());
    this.#videoFrames = [];
  };
}

function memoryUsageInfo() {
  try {
    //@ts-expect-error Performance maybe not contain memory
    const mem = performance.memory;
    return {
      jsHeapSizeLimit: mem.jsHeapSizeLimit,
      totalJSHeapSize: mem.totalJSHeapSize,
      usedJSHeapSize: mem.usedJSHeapSize,
      percentUsed: (mem.usedJSHeapSize / mem.jsHeapSizeLimit).toFixed(3),
      percentTotal: (mem.totalJSHeapSize / mem.jsHeapSizeLimit).toFixed(3),
    };
  } catch {
    return {};
  }
}