"""Render the authored CafeOS dialogue with Apache-2.0 Qwen3-TTS models.

Run on the remote GPU host. References are newly designed synthetic voices;
no audio from the earlier Breeze cut or any real person is used.
"""
import gc
import hashlib
import json
import time
from pathlib import Path

import soundfile as sf
import torch
from qwen_tts import Qwen3TTSModel

ROOT = Path.home() / 'cafeos-demo'
OUT = ROOT / 'audio-submission'
OUT.mkdir(exist_ok=True)
DESIGN = 'Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign'
BASE = 'Qwen/Qwen3-TTS-12Hz-1.7B-Base'
PERSONAS = {
    'assistant': 'A warm, clear adult female voice with a neutral American English accent. A helpful cafe host, calm and confident. Brisk natural conversation with clear consonants. No dramatic pauses.',
    'Aria': 'A relaxed young adult woman speaking clear American English. Friendly, casual, with a slightly husky lower female voice. Conversational and brisk, not a commercial narrator.',
    'Leo': 'A young adult man speaking neutral American English, with a mellow low voice. Relaxed and friendly. Brisk conversational delivery with clear consonants.',
    'Mia': 'A young adult woman with a light, bright, higher voice and a clear American English accent. Curious and friendly, conversational and brisk.',
    'barista': 'An adult male barista with a clear, resonant American English voice. Focused, confident, speaking to a colleague at a brisk natural pace.',
}
REFERENCES = {
    'assistant': 'Welcome to Daylight Coffee. Tell me what you would like, and we will take care of the details together.',
    'Aria': 'Hi there! I am picking up coffee for a friend and me. Let me check what we would like.',
    'Leo': 'Good morning. I would like a warm coffee before heading to work. It is nice and quiet in here.',
    'Mia': 'Hello! Everything on the menu looks lovely. I think I would like an iced coffee today.',
    'barista': 'The counter is ready. I have checked the cups and the tickets. Let us make some good coffee.',
}

torch.set_num_threads(8)
torch.manual_seed(42)
if any(not (OUT / f'reference-{v}.wav').exists() for v in PERSONAS):
    print('Loading VoiceDesign', flush=True)
    design = Qwen3TTSModel.from_pretrained(DESIGN, device_map='cuda:0', dtype=torch.bfloat16, attn_implementation='sdpa')
    for voice in PERSONAS:
        p = OUT / f'reference-{voice}.wav'
        if p.exists():
            continue
        wavs, sr = design.generate_voice_design(text=REFERENCES[voice], language='English', instruct=PERSONAS[voice], max_new_tokens=1024)
        sf.write(p, wavs[0], sr, subtype='PCM_16')
        print('REFERENCE', voice, round(len(wavs[0]) / sr, 2), flush=True)
    del design
    gc.collect()
    torch.cuda.empty_cache()

print('Loading Base', flush=True)
model = Qwen3TTSModel.from_pretrained(BASE, device_map='cuda:0', dtype=torch.bfloat16, attn_implementation='sdpa')
prompts = {voice: model.create_voice_clone_prompt(ref_audio=str(OUT / f'reference-{voice}.wav'), ref_text=REFERENCES[voice], x_vector_only_mode=False) for voice in PERSONAS}
manifest = {'model': BASE, 'referenceModel': DESIGN, 'license': 'Apache-2.0', 'host': 'remote GPU', 'textSource': 'Authored dialogue supplied directly; no model generated the script.', 'referenceOrigin': 'Original synthetic voices generated from written personas, without real-person or Breeze audio references.', 'voices': PERSONAS, 'files': []}
rows = json.loads((ROOT / 'dialogue.json').read_text())
for row in rows:
    for kind, voice in [('user', row['voice']), ('assistant', 'assistant')]:
        text = row[kind]
        p = OUT / f"{row['index']}-{kind}.wav"
        start = time.monotonic()
        if not p.exists():
            torch.manual_seed(4200 + row['index'])
            wavs, sr = model.generate_voice_clone(text=text, language='English', voice_clone_prompt=prompts[voice], max_new_tokens=1024)
            sf.write(p, wavs[0], sr, subtype='PCM_16')
        info = sf.info(p)
        manifest['files'].append({'file': p.name, 'text': text, 'voice': voice, 'durationSeconds': round(info.duration, 4), 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()})
        (OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
        print(p.name, round(info.duration, 2), 'seconds audio;', round(time.monotonic() - start, 2), 'seconds generation', flush=True)
print('COMPLETE', len(manifest['files']), flush=True)
