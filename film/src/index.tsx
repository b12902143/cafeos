import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {SubmissionFilm} from './submission';
import story from './submission-story.json';
const Root:React.FC=()=> <Composition id="CafeOS-Submission" component={SubmissionFilm} durationInFrames={(story.duration+3)*30} fps={30} width={1920} height={1080}/>;
registerRoot(Root);
