import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {SubmissionFilm} from './submission';
import story from './submission-story.json';
import {IntroFilm, INTRO_FRAMES} from './intro';
const Root:React.FC=()=> <><Composition id="CafeOS-Intro" component={IntroFilm} durationInFrames={INTRO_FRAMES} fps={30} width={1920} height={1080}/><Composition id="CafeOS-Submission" component={SubmissionFilm} durationInFrames={story.duration*30+INTRO_FRAMES} fps={30} width={1920} height={1080}/></>;
registerRoot(Root);
