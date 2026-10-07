# Third-party notices and provenance

Application logic, English and Traditional Chinese interface copy, scenario dialogue, vector scene, recipient highlighting, and presentation content were authored with AI assistance for this project. The developer supplied all demo text directly; inference models did not write the script.

## Models

- Intent: [Qwen/Qwen3.8-27B](https://huggingface.co/Qwen/Qwen3.8-27B), Apache 2.0.
- Recognition: [Qwen/Qwen3-ASR-1.7B](https://huggingface.co/Qwen/Qwen3-ASR-1.7B), Apache 2.0.
- Synthetic voice design: [Qwen3-TTS-12Hz-1.7B-VoiceDesign](https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign), Apache 2.0.
- Speech generation: [Qwen3-TTS-12Hz-1.7B-Base](https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-Base), Apache 2.0; [official implementation](https://github.com/QwenLM/Qwen3-TTS).

Only synthetic output WAVs and their provenance manifests are included, not model weights. The references describe fictional character voices, without real-person audio. The older Breeze research recordings and films are excluded from this distribution.

## Fonts and images

DM Sans and Manrope are bundled under the SIL Open Font License. Their original license texts are in `public/assets/fonts/dmsans-OFL.txt` and `manrope-OFL.txt`.

The cafe still-life image was generated for the application with the built-in image generation tool. Its prompt and provenance are in `public/assets/provenance.json`. It is not a photograph of an actual business or person. The scene film itself uses authored React/SVG/CSS graphics.

## Software

Node dependencies are declared with locked versions in `package-lock.json`; the package does not bundle `node_modules`. `ws` and `qrcode` use MIT licenses. The separate animation package uses React and Remotion. Remotion has its own license, copied to `licenses/Remotion-LICENSE.md`, and third-party notices in `licenses/Remotion-THIRD_PARTY_LICENSES.md`; do not treat its license as MIT. Python runtime packages and model tooling retain their own licenses.

## Evaluation evidence

The movie shows an authored simulation. Its prerecorded speech and edited timing do not establish live latency. Engine assertions, automated tests, ASR transcriptions and individual remote intent timings have their separate scopes recorded in `evidence/` and the proposal.
