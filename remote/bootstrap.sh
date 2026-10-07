#!/usr/bin/env bash
set -euo pipefail
TASK_ROOT="$(cd "$(dirname "$0")" && pwd)"
TASK_CACHE="/tmp/cafeos-uv-${USER}"
TASK_LLM_ENV="/tmp/cafeos-llm-${USER}"
TASK_TTS_ENV="/tmp/cafeos-tts-${USER}"
TASK_ASR_ENV="/tmp/cafeos-asr-${USER}"
TASK_UV="${HOME}/.local/bin/uv"
export UV_CACHE_DIR="$TASK_CACHE"
cd "$TASK_ROOT"
python3 -c 'import torch; assert torch.cuda.is_available(), "CUDA PyTorch is required on this remote host"; print(torch.__version__, torch.cuda.get_device_name(0))'
"$TASK_UV" venv --allow-existing --python /usr/bin/python3 --system-site-packages "$TASK_LLM_ENV"
"$TASK_UV" pip install --python "$TASK_LLM_ENV/bin/python" transformers==5.18.0
"$TASK_UV" venv --allow-existing --python /usr/bin/python3 --system-site-packages "$TASK_TTS_ENV"
"$TASK_UV" pip install --python "$TASK_TTS_ENV/bin/python" --no-deps qwen-tts==0.1.1 transformers==4.57.3 torchaudio==2.8.0
"$TASK_UV" pip install --python "$TASK_TTS_ENV/bin/python" 'huggingface-hub<1' 'tokenizers>=0.22,<0.23' soundfile librosa sox onnxruntime einops fastapi uvicorn python-multipart requests
"$TASK_UV" venv --allow-existing --python /usr/bin/python3 --system-site-packages "$TASK_ASR_ENV"
"$TASK_UV" pip install --python "$TASK_ASR_ENV/bin/python" --no-deps qwen-asr==0.0.6 torchaudio==2.8.0 qwen-omni-utils accelerate==1.12.0
"$TASK_UV" pip install --python "$TASK_ASR_ENV/bin/python" transformers==4.57.6 soundfile librosa sox nagisa soynlp av psutil pillow einops
test -f audio-submission/reference-assistant.wav || { printf 'Copy the supplied synthetic reference WAVs into audio-submission first.\n' >&2; exit 1; }
start_service() {
  local name="$1" signature="$2"; shift 2
  if [ -f "$name.pid" ]; then
    local pid; pid="$(cat "$name.pid")"
    if [[ "$pid" =~ ^[0-9]+$ ]] && ps -p "$pid" -o args= | grep -q "$signature"; then printf '%s is already running (PID %s).\n' "$name" "$pid"; return; fi
  fi
  nohup "$@" > "$TASK_ROOT/$name.log" 2>&1 < /dev/null &
  echo "$!" > "$TASK_ROOT/$name.pid"
  printf '%s started; see %s/%s.log.\n' "$name" "$TASK_ROOT" "$name"
}
start_service llm llm_server.py "$TASK_LLM_ENV/bin/python" -u "$TASK_ROOT/llm_server.py"
start_service asr asr_server.py "$TASK_ASR_ENV/bin/python" -u "$TASK_ROOT/asr_server.py"
start_service qwen-tts qwen_tts_server.py "$TASK_TTS_ENV/bin/python" -u "$TASK_ROOT/qwen_tts_server.py"
