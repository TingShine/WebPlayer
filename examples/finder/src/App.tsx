import { useEffect, useRef, useState } from 'react'

import './App.css'
import { CodecsExtractFrameWorkerModule } from '@web-player/finder'
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { message, Upload, Image } from 'antd';
import { videoFrame2Url } from '../../../packages/common/utils';
import TimeLine, { TimeLineAPI } from './TimeLine';
import { debounce } from 'lodash-es'

const { Dragger } = Upload;

function App() {
  const ref = useRef<CodecsExtractFrameWorkerModule>()
  const [src, setSrc] = useState('')
  const timeLineRef = useRef<TimeLineAPI>(null)

  const durationRef = useRef(0)

  const props: UploadProps = {
    multiple: false,
    accept: 'video/mp4,video/quicktime',
    beforeUpload: async (file) => {
      ref.current = new CodecsExtractFrameWorkerModule()
      
      try {
        const { duration } = await ref.current.load(file)
        durationRef.current = duration!

        const start = performance.now()
        const firstFrame = await ref.current.find(0)
        const cost = performance.now() - start

        if (firstFrame) {
          const url = videoFrame2Url(firstFrame, `${cost.toFixed(2)} ms`)
          setSrc(url)
        }

        const start2 = performance.now()
        const frames = await ref.current.thumbnails({ start: 0, end: duration!, step: 1e6 })
        const cost2 = performance.now() - start2        

        timeLineRef.current?.load(frames, Number(cost2.toFixed(2)))
      } catch (err) {
        message.error((err as Error).message)
      }
      
      return false
    },
  }

  const handleMove = debounce(async (ratio: number) => {
    const time = durationRef.current * ratio
    if (ref.current) {
      const start = performance.now()
      const frame = await ref.current.find(time)
      const cost = performance.now() - start

      if (frame)
        setSrc(videoFrame2Url(frame, `${cost.toFixed(2)} ms`))
    }
  }, 50)

  useEffect(() => {
    if (ref.current) {
      ref.current.destroy()
    }
  }, [])

  return (
    <>
      <div className='m-auto'>
        <div className='text-4xl font-bold mb-8'>WebCodecs Extract Frame</div>
        <Dragger {...props}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag file to this area to upload</p>
          <p className="ant-upload-hint">
            Support for a single or bulk upload. Strictly prohibited from uploading company data or other
            banned files.
          </p>
        </Dragger>
        <div className='mb-10 mt-10'>
          <Image width={200} src={src} ></Image>
        </div>
        <div className='mt-10'>
          <TimeLine ref={timeLineRef} height={100} onMove={handleMove}/>
        </div>
      </div>
    </>
  )
}

export default App
