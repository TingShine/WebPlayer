import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

interface TimeLineProps {
	height?: number
	onMove?: (ratio: number) => void
}

export interface TimeLineAPI {
	load: (frames: VideoFrame[], cost?: number) => void
}

const TimeLine = forwardRef<TimeLineAPI, TimeLineProps>(({ height = 100, onMove,  ...props }, ref) => {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const cursorRef = useRef<HTMLDivElement>(null)
	const ctxRef = useRef<CanvasRenderingContext2D>()
	const [visible, setVisible] = useState(false)
	const isDragging = useRef(false)
	const widthRef = useRef(0)

	useImperativeHandle(ref, () => {
		return {
			load: (frames, cost) => {
				if (frames && frames.length && ctxRef.current) {
					const firstFrame = frames[0]
					const width = firstFrame.displayWidth
					canvasRef.current!.width = width * frames.length
					canvasRef.current!.height = firstFrame.displayHeight

					widthRef.current = width * frames.length
		
					for (let i = 0; i < frames.length; i++) {
						const vf = frames[i]
						ctxRef.current.drawImage(vf, width * i, 0)
					}
		
					if (cost) {
						ctxRef.current.fillStyle = 'white'
						ctxRef.current.font = '120px Arial'
						ctxRef.current.fillText(`${cost} ms`, 120, 200)
					}

					setVisible(true)
				} else {
					setVisible(false)
				}
			}
		}
	})

	const [left, setLeft] = useState(0)

	useEffect(() => {
		ctxRef.current = canvasRef.current!.getContext('2d')!

		cursorRef.current?.addEventListener('mousedown', () => {
			isDragging.current = true
		})

		cursorRef.current?.addEventListener('mouseup', () => {
			isDragging.current = false
		})

		canvasRef.current?.addEventListener('mousemove', (e) => {
			if (!isDragging.current) return

			const rect = canvasRef.current!.getBoundingClientRect()
			const x = e.clientX - rect.left

			const ratio = x / rect.width
			setLeft(x)
			onMove?.(ratio)
		})

		canvasRef.current?.addEventListener('click', (e) => {
			const rect = canvasRef.current!.getBoundingClientRect()
			const x = e.clientX - rect.left

			const ratio = x / rect.width

			setLeft(x)
			onMove?.(ratio)
		})
	}, [])

	return (
		<div className="relative rounded shadow" style={{ height: `${height}px`, visibility: visible ? 'visible' : 'hidden' }} {...props}>
			<canvas
			ref={canvasRef}
			className="h-full rounded"
			/>
			<div ref={cursorRef} className="absolute w-1 bg-blue-500 cursor-pointer" style={{ height: `${height + 12}px`, left, top: '-6px' }}></div>
		</div>
	)
}
)

export default TimeLine