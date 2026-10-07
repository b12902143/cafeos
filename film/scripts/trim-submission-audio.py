"""Remove only leading/trailing silence; preserve the original speech speed."""
import array
import hashlib
import json
import math
import subprocess
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
source = ROOT / 'public/audio/submission'
target = ROOT / 'public/audio/submission-trimmed'
target.mkdir(exist_ok=True)
manifest = json.loads((source / 'manifest.json').read_text())
for row in manifest['files']:
    with wave.open(str(source / row['file'])) as wav:
        assert wav.getsampwidth() == 2 and wav.getnchannels() == 1
        rate = wav.getframerate()
        samples = array.array('h', wav.readframes(wav.getnframes()))
    window = round(rate * .02)
    threshold = (32768 * 10 ** (-43 / 20)) ** 2
    active = [i for i, start in enumerate(range(0, len(samples), window))
              if sum(v * v for v in samples[start:start + window]) /
              len(samples[start:start + window]) > threshold]
    assert active, row['file']
    start = max(0, active[0] * .02 - .08)
    end = min(len(samples) / rate, (active[-1] + 1) * .02 + .12)
    output = target / row['file']
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(source / row['file']),
                    '-af', f'atrim=start={start:.6f}:end={end:.6f},asetpts=PTS-STARTPTS',
                    '-c:a', 'pcm_s16le', str(output)], check=True)
    with wave.open(str(output)) as wav:
        duration = wav.getnframes() / wav.getframerate()
    row.update(sourceSha256=row['sha256'], trimStartSeconds=round(start, 4),
               trimEndSeconds=round(end, 4), durationSeconds=round(duration, 4),
               sha256=hashlib.sha256(output.read_bytes()).hexdigest())
manifest['processing'] = 'Outer silence trimmed with 80 ms start and 120 ms end padding; no speed or pitch change.'
(target / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(f'Trimmed {len(manifest["files"])} clips without changing speech speed.')
