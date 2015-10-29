# <fxos-camera>
- pass size of element (* dpr) for viewfinder (default)
- [scale="aspect-fit/fill"]
- pictureSize is automatically the biggest (from gecko)
- videoSize is automatically 1080p (from gecko)
- automatically re-configure to default if a bad config is given
- default to back camera (from gecko)
- default to picture mode (from gecko)
- element has its own DeviceStorage by default (can be overridden)
- takePicture and start/stopRecording save to DeviceStorage by default
- takePicture(true)
- Pass filename to takePicture/startRecording (default picture.jpg/video.mp4)

# Things needed in advance
- mode
- previewSize
- pictureSize
- recorderProfile

# Things to expose
- effects
- sceneMode
- flashMode
- focusMode
- whiteBalance
- isoMode
- exposureCompensation
