# SFace identity model

File: `face_recognition_sface_2021dec.onnx` (38,696,353 bytes).

Source: OpenCV Zoo, revision `eb9f4f2d4b79b58e5513b5d25d5f0243a8357bf4`.

Download: https://media.githubusercontent.com/media/opencv/opencv_zoo/eb9f4f2d4b79b58e5513b5d25d5f0243a8357bf4/models/face_recognition_sface/face_recognition_sface_2021dec.onnx

SHA-256 (verified against the upstream Git LFS pointer):
`0ba9fbfa01b5270c96627c4ef784da859931e02f04419c829e83484087c34e79`.

Upstream directory license is included as `SFACE-LICENSE` (Apache 2.0).
Reference: https://github.com/opencv/opencv_zoo/tree/eb9f4f2d4b79b58e5513b5d25d5f0243a8357bf4/models/face_recognition_sface

SFace produces identity embeddings; the original supplied detector and liveness
model remain responsible for face detection and real/spoof classification.
The default cosine threshold here is 0.5 with a 0.05 runner-up gap. These are
configurable starting values, not a claim of evaluated attendance accuracy.
