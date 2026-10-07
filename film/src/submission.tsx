import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Fonts} from './scene';
import {FullCafeFilm, FullStory} from './full';
import story from './submission-story.json';

export const SubmissionFilm: React.FC = () => <AbsoluteFill>
  <Sequence durationInFrames={90}>
    <AbsoluteFill style={{background:'#183d35',color:'#f7f7ee',fontFamily:'DM Sans',justifyContent:'center',padding:'0 150px'}}>
      <Fonts/>
      <div style={{color:'#d8ef85',fontSize:38,fontWeight:600,marginBottom:22}}>Stage I prototype demonstration</div>
      <div style={{fontSize:136,fontWeight:700,letterSpacing:-5}}>CafeOS</div>
      <div style={{fontSize:54,marginTop:20}}>Voice guidance for a connected cafe</div>
      <div style={{fontSize:34,marginTop:78,color:'#d2dec7'}}>Authored simulation · Prerecorded synthetic voices</div>
    </AbsoluteFill>
  </Sequence>
  <Sequence from={90}><FullCafeFilm story={story as unknown as FullStory}/></Sequence>
</AbsoluteFill>;
