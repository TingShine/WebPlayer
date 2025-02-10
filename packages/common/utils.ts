
export const videoFrame2Url = (vf: VideoFrame, text?: string) => {
		const canvas = document.createElement('canvas')
		const ctx = canvas.getContext('2d')!

		canvas.width = vf.displayWidth
		canvas.height = vf.displayHeight

		ctx?.drawImage(vf, 0, 0, vf.displayWidth, vf.displayHeight)

		if (text) {
			ctx.fillStyle = 'white';
			ctx.font = '40px Arial';
			ctx.fillText(text, 10, 50);
		}

		const url = canvas.toDataURL('image/png')

		return url
}