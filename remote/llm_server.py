"""Run only on the remote GPU. No cloud API, no local-Mac inference."""
import json, os, threading, time
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
import torch
from transformers import AutoTokenizer, Qwen3_5ForConditionalGeneration

MODEL = os.environ.get("CAFE_MODEL", "Qwen/Qwen3.8-27B")
lock = threading.Lock()
print(f"Loading {MODEL} on CUDA", flush=True)
tokenizer = AutoTokenizer.from_pretrained(MODEL)
model = Qwen3_5ForConditionalGeneration.from_pretrained(MODEL, dtype=torch.bfloat16, device_map="cuda:0", attn_implementation="sdpa")
print(f"READY {MODEL}; allocated={torch.cuda.memory_allocated()/2**30:.2f} GiB", flush=True)

class Handler(BaseHTTPRequestHandler):
    def reply(self, status, payload):
        data = json.dumps(payload).encode(); self.send_response(status)
        self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(data))); self.end_headers(); self.wfile.write(data)
    def do_GET(self):
        self.reply(200, {"ok": True, "model": MODEL, "device": torch.cuda.get_device_name(0), "allocatedGiB": round(torch.cuda.memory_allocated()/2**30,2)})
    def do_POST(self):
        try:
            n = int(self.headers.get("Content-Length", 0))
            if n > 500_000: raise ValueError("Request too large")
            body = json.loads(self.rfile.read(n))
            messages = body["messages"]
            with lock, torch.inference_mode():
                start=time.monotonic()
                prompt=tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True, enable_thinking=False)
                inputs=tokenizer(prompt, return_tensors="pt").to("cuda:0")
                output=model.generate(**inputs, max_new_tokens=min(int(body.get("max_tokens",512)),1024), do_sample=False)
                content=tokenizer.decode(output[0][inputs["input_ids"].shape[-1]:],skip_special_tokens=True)
            self.reply(200,{"model":MODEL,"content":content,"elapsedMs":round((time.monotonic()-start)*1000),"tokens":int(output.shape[-1]-inputs["input_ids"].shape[-1])})
        except Exception as e: self.reply(500,{"error":str(e)})

ThreadingHTTPServer(("127.0.0.1",8765),Handler).serve_forever()
