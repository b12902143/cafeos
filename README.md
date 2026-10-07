# CafeOS

[Watch the narrated demo on YouTube](https://youtu.be/Ko5RQ8OMbwY) · [Source repository](https://github.com/b12902143/cafeos)

Voice guidance for a connected cafe. Customers order and revise drinks; staff receive recipe guidance and approve late changes. A deterministic transaction engine owns orders, ingredient reservations, versions and retry receipts.

## Run the application

Requires Node.js 22 or newer.

```sh
npm ci
npm start
```

Open http://127.0.0.1:4317. Start the demo and choose Play all, or use Next scene to control the pace. This browser walkthrough contains 17 authored cues and executes real transaction commands. It works without a GPU or API key because the synthetic voice clips are included. Reset clears only the fictional demo store.

Free play exposes manual ordering, preparation, cancellation and collection. A second screen at `/customer?customer=Aria` receives actual WebSocket state updates. Store state and retry receipts persist in `data/state.json`. The current role system is for demonstration; it does not authenticate real people.

## Complete scenario film

The separately supplied `CafeOS_demo.mp4` is the primary presentation: 1920 × 1080, 30 fps, 2 minutes 58 seconds, including a 15-second narrated introduction about simultaneous customer and staff interaction. The following service scenario has 23 scripted turns covering three orders, including partial completion, customer pickup, cancellation and an empty active queue. The service scenario uses 56 state snapshots executed using the real store engine; the introductory animation illustrates the shared-state concept. The movie is an authored animation with prerecorded synthetic voices, and its pacing is not a live latency measurement.

The editable animation source is in `film/`. Intro narration and timing are in `film/intro.json`, with audio and its transcription check in `public/audio/intro/`. Service dialogue is in `film/dialogue.json`; every utterance has an explicit recipient. Source recordings are in `public/audio/submission`, with text, model and SHA-256 manifests. VoiceDesign generated five original synthetic references, then Qwen3-TTS Base spoke the supplied lines. No real person's voice or earlier restricted-license audio is used in this package.

To reproduce the submitted cut, install FFmpeg and Python 3, then:

```sh
cd film
npm ci
npm run prepare:submission
npm run typecheck
npm run render:submission
```

The output is `submission/CafeOS_demo.mp4`. The preparation step trims outer silence without changing pitch or speed, normalizes speech, and validates order transitions. Rendering uses local graphics tools; it performs no local model inference.

## Optional remote inference

Live speech and intent inference need a separately configured GPU host. The supplied NVIDIA setup was exercised on a 96 GB GPU. It is not an Intel deployment. The 27B model in BF16 alone occupies about 51 GiB; the contest's 32 GB Intel target requires quantization or a smaller model and remains future work.

| Port | Service | Model |
| --- | --- | --- |
| 8765 | Structured intent | Qwen/Qwen3.8-27B |
| 8767 | Speech recognition | Qwen/Qwen3-ASR-1.7B |
| 8768 | Speech synthesis | Qwen/Qwen3-TTS-12Hz-1.7B-Base |

`remote/bootstrap.sh` records the tested Linux environment recipe: CUDA PyTorch 2.8, Python, and `uv` must already exist. It creates separate temporary environments and may download large model weights. Inspect the script and configure the host before running it. Models and Python environments are not bundled.

```sh
# Replace gpu-host with your own configured SSH alias.
ssh gpu-host 'mkdir -p ~/cafeos-demo'
scp remote/*.py remote/bootstrap.sh gpu-host:cafeos-demo/
scp -r public/audio/submission gpu-host:cafeos-demo/audio-submission
ssh -T gpu-host 'bash ~/cafeos-demo/bootstrap.sh'
CAFE_SSH_HOST=gpu-host bash scripts/connect.sh
```

Run the Node application separately. All remote services bind to loopback and are reached through SSH. Override `CAFE_REMOTE_URL`, `CAFE_ASR_URL`, or `CAFE_TTS_URL` when needed. `/api/status` reports actual availability. Microphone capture in physical cafe noise and end-to-end real-time performance have not been validated.

To regenerate voice assets remotely, copy `film/dialogue.json` to the remote working directory and run `remote/render_submission.py` in its Qwen TTS environment. Do not run that model script on the presentation laptop.

## Validation and limits

```sh
npm test
```

Ten tests cover stock reservation, atomic rollback, stale edits, ownership, late-change approval, persisted retries, two real WebSocket clients and whole-order handoff. The film-generation script also verifies final inventory and customer-facing wording. `evidence/` contains a sanitized record of the checks and the three previously measured intent requests. Those three timings are individual observations, not benchmark percentiles.

The app uses fictional menu prices and logical stock portions. Staff report recipe progress; no camera verifies physical brewing. Production authentication, payment, POS integrations, a real cafe pilot, and the designated Intel platform remain future work. The proposed Stage II acceptance targets are stated separately in the proposal.

See `THIRD_PARTY_NOTICES.md` for software, model and asset provenance. No model weights are redistributed. No upload or contest submission is performed by any packaging script.
