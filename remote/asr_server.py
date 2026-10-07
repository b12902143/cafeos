"""Receive mono WAV from the browser and transcribe on the remote GPU GPU."""
import base64, io, json, threading, time
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
import numpy as np, soundfile as sf, torch
from qwen_asr import Qwen3ASRModel
MODEL='Qwen/Qwen3-ASR-1.7B'
model=Qwen3ASRModel.from_pretrained(MODEL,dtype=torch.bfloat16,device_map='cuda:0',max_inference_batch_size=1,max_new_tokens=256)
lock=threading.Lock()
print('ASR READY',flush=True)
class Handler(BaseHTTPRequestHandler):
 def reply(self,status,payload):
  data=json.dumps(payload).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
 def do_GET(self):self.reply(200,{'ok':True,'model':MODEL})
 def do_POST(self):
  try:
   size=int(self.headers.get('Content-Length',0))
   if size>6_000_000:raise ValueError('Audio too large')
   body=json.loads(self.rfile.read(size));data,rate=sf.read(io.BytesIO(base64.b64decode(body['audio'],validate=True)),dtype='float32')
   if data.ndim!=1 or len(data)/rate>35:raise ValueError('Use a mono recording under 35 seconds')
   start=time.monotonic()
   with lock: result=model.transcribe(audio=(data,rate),language=None)[0]
   self.reply(200,{'text':result.text,'language':result.language,'model':MODEL,'elapsedMs':round((time.monotonic()-start)*1000)})
  except Exception as e:self.reply(500,{'error':str(e)})
ThreadingHTTPServer(('127.0.0.1',8767),Handler).serve_forever()
