import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {FullCafeFilm, FullStory} from './full';
import story from './submission-story.json';
import {IntroFilm, INTRO_FRAMES} from './intro';

export const SubmissionFilm: React.FC = () => <AbsoluteFill>
  <Sequence durationInFrames={INTRO_FRAMES}><IntroFilm/></Sequence>
  <Sequence from={INTRO_FRAMES}><FullCafeFilm story={story as unknown as FullStory}/></Sequence>
</AbsoluteFill>;
