"""Loopback-only Qwen3-TTS adapter using the project's synthetic references."""
import os
import threading
from pathlib import Path

import numpy as np
import torch
from fastapi import FastAPI, Form, HTTPException
from fastapi.responses import Response
from qwen_tts import Qwen3TTSModel
import uvicorn

MODEL = 'Qwen/Qwen3-TTS-12Hz-1.7B-Base'
ROOT = Path(__file__).resolve().parent
REFERENCES = Path(os.environ.get('CAFE_REFERENCE_DIR', ROOT / 'audio-submission'))
TEXTS = {
    'assistant': 'Welcome to Daylight Coffee. Tell me what you would like, and we will take care of the details together.',
    'Aria': 'Hi there! I am picking up coffee for a friend and me. Let me check what we would like.',
    'Leo': 'Good morning. I would like a warm coffee before heading to work. It is nice and quiet in here.',
    'Mia': 'Hello! Everything on the menu looks lovely. I think I would like an iced coffee today.',
    'barista': 'The counter is ready. I have checked the cups and the tickets. Let us make some good coffee.',
}
torch.set_num_threads(8)
model = Qwen3TTSModel.from_pretrained(MODEL, device_map='cuda:0', dtype=torch.bfloat16, attn_implementation='sdpa')
prompts = {voice: model.create_voice_clone_prompt(ref_audio=str(REFERENCES / f'reference-{voice}.wav'), ref_text=text, x_vector_only_mode=False) for voice, text in TEXTS.items()}
lock = threading.Lock()
app = FastAPI()


@app.get('/health')
def health():
    return {'ok': True, 'model': MODEL, 'license': 'Apache-2.0', 'referenceOrigin': 'Original synthetic voices'}


@app.post('/v1/audio/speech')
def speech(text: str = Form(...), voice: str = Form('assistant')):
    if voice not in prompts or not text.strip() or len(text) > 800:
        raise HTTPException(400, 'Invalid voice or text.')
    with lock:
        wavs, rate = model.generate_voice_clone(text=text, language='Auto', voice_clone_prompt=prompts[voice], max_new_tokens=2048)
    pcm = (np.clip(wavs[0], -1, 1) * 32767).astype('<i2').tobytes()
    return Response(content=pcm, media_type='application/octet-stream', headers={'X-Sample-Rate': str(rate), 'X-Model': MODEL})


if __name__ == '__main__':
    uvicorn.run(app, host='127.0.0.1', port=int(os.environ.get('CAFE_QWEN_TTS_PORT', '8768')))
