import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir} from 'node:fs/promises';
import {basename} from 'node:path';
const exec = promisify(execFile);
const format = 'aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo';
const target = 'loudnorm=I=-18:TP=-2:LRA=7';
const parse = (stderr) => JSON.parse(stderr.match(/\{\s*"input_i"[\s\S]*?\}/)[0]);

export async function prepareAudio(root, clips, folder='scene-sample') {
  await mkdir(`${root}public/audio/${folder}`,{recursive:true});
  const results = {};
  for (const clip of clips) {
    const input = `${root}public/audio/${clip.file}`;
    const output = `${root}public/audio/${folder}/${basename(clip.file)}`;
    const analysis = await exec('ffmpeg',['-hide_banner','-i',input,'-af',`${format},${target}:print_format=json`,'-f','null','-']);
    const m = parse(analysis.stderr);
    const filter = `${format},${target}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
    await exec('ffmpeg',['-y','-hide_banner','-i',input,'-af',filter,'-ar','48000','-ac','2','-c:a','pcm_s16le',output]);
    const verification = await exec('ffmpeg',['-hide_banner','-i',output,'-af',`${target}:print_format=json`,'-f','null','-']);
    const v = parse(verification.stderr);
    results[clip.file] = {sourceIntegratedLufs:Number(m.input_i),integratedLufs:Number(v.input_i),truePeakDbtp:Number(v.input_tp),renderFile:`${folder}/${basename(clip.file)}`};
    console.log(`${clip.speaker}: ${m.input_i} → ${v.input_i} LUFS; peak ${v.input_tp} dBTP`);
  }
  return results;
}
