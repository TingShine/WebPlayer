import mp4box, { type AudioTrackOpts, type MP4ArrayBuffer, type MP4File, type MP4Info, type MP4Sample, type TrakBoxParser, type VideoTrackOpts } from 'mp4box'
import type { ExtMP4Sample } from './type'
import type { WebFetcher } from '../fetcher'
import type { IFileReader } from '../fetcher'
import type { MP4DecodeConf } from '../decoder/type'

export async function mp4FileToSamples(fetcher: WebFetcher) {
	let mp4Info: MP4Info | null = null
	let videoTrack: VideoTrackOpts | null = null
	const decoderConfig: MP4DecodeConf = { video: null, audio: null }
	const videoSamples: ExtMP4Sample[] = []

	let videoDeltaTS = -1
	const reader = await fetcher.getReader()
	await quickParseMP4File(
		reader,
		(data) => {
			mp4Info = data.info
			const { videoDecoderConf: vc, videoTrackConf: vt } = extractFileConfig(data.mp4boxFile, data.info)
			decoderConfig.video = vc ?? null
			videoTrack = vt ?? null

			if (vc === null) {
				console.error('No video track')
			}
			console.log('mp4boxfile moov ready', decoderConfig)
		},
		(_, type, samples) => {
			if (type === 'video') {
				if (videoDeltaTS === -1) videoDeltaTS = samples[0].dts
				for (const sample of samples) {
					videoSamples.push(normalizeTimescale(sample, videoDeltaTS, 'video'))
				}
			}
		}
	)
 
	const lastSample = videoSamples.at(-1)
	if (mp4Info == null) {
		throw new Error('Stream is done, but not emit ready')
	} else if (lastSample == null) {
		throw new Error('Stream not contain any sample')
	}

	// 修复首帧黑屏
	fixFirstBlackFrame(videoSamples)

	return {
		videoSamples,
		decoderConfig,
		videoTrack
	}
}

function fixFirstBlackFrame(samples: ExtMP4Sample[]) {
	let iframeCnt = 0
	let minCtsSample: ExtMP4Sample | null = null

	for (const s of samples) {
		if (s.deleted) continue
		if (s.is_sync) iframeCnt += 1
		if (iframeCnt >= 2) break

		if (minCtsSample == null || s.cts < minCtsSample.cts) {
			minCtsSample = s
		}

		// 消除200ms内的黑帧
		if (minCtsSample != null && minCtsSample.cts < 200e3) {
			minCtsSample.duration += minCtsSample.cts
			minCtsSample.cts = 0
		}
	}
}

export async function quickParseMP4File(
	reader: IFileReader,
	onReady: (data: { mp4boxFile: MP4File, info: MP4Info }) => void,
	onSamples: (id: number, sampleType: 'video' | 'audio', samples: MP4Sample[]) => void
) {
	const mp4boxFile: MP4File = mp4box.createFile(false)
	mp4boxFile.onReady = (info: MP4Info) => {
		onReady({ mp4boxFile, info })
		const vTrackId = info.videoTracks[0]?.id
		if (vTrackId !== null) {
			mp4boxFile.setExtractionOptions(vTrackId, 'video', { nbSamples: 100 })
		}

		// TODO: 音频

		mp4boxFile.start()
	}

	mp4boxFile.onSamples = onSamples

	async function parse() {
		let cursor = 0;
		const maxReadSize = 30 * 1024 * 1024	// 30MB
		while (true) {
			const data = (await reader.read(
				maxReadSize, {
					at: cursor
				}				
			)) as MP4ArrayBuffer

			if (data.byteLength === 0) break
			data.fileStart = cursor
			const nextPos = mp4boxFile.appendBuffer(data)

			if (nextPos == null) break
			cursor = nextPos
		}
	}
	await parse()

	mp4boxFile.stop()
}


export function extractFileConfig(file: MP4File, info: MP4Info) {
  const vTrack = info.videoTracks[0];
  const rs: {
    videoTrackConf?: VideoTrackOpts;
    videoDecoderConf?: Parameters<VideoDecoder['configure']>[0];
    audioTrackConf?: AudioTrackOpts;
    audioDecoderConf?: Parameters<AudioDecoder['configure']>[0];
  } = {};
  if (vTrack != null) {
    const videoDesc = parseVideoCodecDesc(file.getTrackById(vTrack.id)).buffer;
    const { descKey, type } = vTrack.codec.startsWith('avc1')
      ? { descKey: 'avcDecoderConfigRecord', type: 'avc1' }
      : vTrack.codec.startsWith('hvc1')
        ? { descKey: 'hevcDecoderConfigRecord', type: 'hvc1' }
        : { descKey: '', type: '' };
    if (descKey !== '') {
      rs.videoTrackConf = {
        timescale: 1e6,
        duration: normalizeTime(vTrack.duration, vTrack.timescale),
        width: vTrack.video.width,
        height: vTrack.video.height,
        brands: info.brands,
        type,
        [descKey]: videoDesc,
      };
    }

    rs.videoDecoderConf = {
      codec: vTrack.codec,
      codedHeight: vTrack.video.height,
      codedWidth: vTrack.video.width,
      description: videoDesc,
    };
  }

	// TODO: 处理音频配置
  return rs;
}

// track is H.264, H.265 or VPX.
function parseVideoCodecDesc(track: TrakBoxParser): Uint8Array {
  for (const entry of track.mdia.minf.stbl.stsd.entries) {
    // @ts-ignore
    const box = entry.avcC ?? entry.hvcC ?? entry.av1C ?? entry.vpcC;
    if (box != null) {
      const stream = new mp4box.DataStream(
        undefined,
        0,
        mp4box.DataStream.BIG_ENDIAN,
      );
      box.write(stream);
      return new Uint8Array(stream.buffer.slice(8)); // Remove the box header.
    }
  }
  throw Error('avcC, hvcC, av1C or VPX not found');
}

function isIDRFrame(u8Arr: Uint8Array, type: MP4Sample['description']['type']) {
  if (type !== 'avc1' && type !== 'hvc1') return true;

  const dv = new DataView(u8Arr.buffer);
  let i = 0;
  while (i < u8Arr.byteLength - 4) {
    if (type === 'avc1' && (dv.getUint8(i + 4) & 0x1f) === 5) {
      return true;
    } else if (type === 'hvc1') {
      const nalUnitType = (dv.getUint8(i + 4) >> 1) & 0x3f;
      if (nalUnitType === 19 || nalUnitType === 20) return true;
    }
    // 跳至下一个 NALU 继续检查
    i += dv.getUint32(i) + 4;
  }
  return false;
}

// 获取起始位置的 SEI 长度
function seiLenOfStart(
  u8Arr: Uint8Array,
  type: MP4Sample['description']['type'],
) {
  if (type !== 'avc1' && type !== 'hvc1') return 0;

  const dv = new DataView(u8Arr.buffer);
  if (type === 'avc1' && (dv.getUint8(4) & 0x1f) === 6) {
    return dv.getUint32(0) + 4;
  }
  if (type === 'hvc1') {
    const nalUnitType = (dv.getUint8(4) >> 1) & 0x3f;
    if (nalUnitType === 39 || nalUnitType === 40) {
      return dv.getUint32(0) + 4;
    }
  }
  return 0;
}


function normalizeTimescale(s: MP4Sample, delta = 0, sampleType: 'video'| 'audio') {
	const is_idr = sampleType === 'video' && s.is_sync && isIDRFrame(s.data, s.description.type)
	let offset = s.offset
	let size = s.size
	if (is_idr) {
		// 当 IDR 帧前面携带 SEI 数据可能导致解码失败
    // 所以此处通过控制 offset、size 字段 跳过 SEI 数据
		const seiLen = seiLenOfStart(s.data, s.description.type)
		offset += seiLen
		size -= seiLen
	}

	return {
		...s,
		is_idr,
		offset,
		size,
		cts: ((s.cts - delta) / s.timescale) * 1e6,
		dts: ((s.dts - delta) / s.timescale) * 1e6,
		duration: (s.duration / s.timescale) * 1e6,
		timescale: 1e6,
		// 音频数据量小可控，直接保存在内存中
		data: sampleType === 'video' ? null : s.data
	}
}

function normalizeTime(time: number, timescale: number) {
	return time / timescale * 1e6
}