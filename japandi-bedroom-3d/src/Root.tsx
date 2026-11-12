import { Composition } from "remotion";
import { JapandiBedroom } from "./Video";
import { FPS, DURATION_IN_FRAMES, WIDTH, HEIGHT } from "./timeline";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="JapandiBedroom"
    component={JapandiBedroom}
    durationInFrames={DURATION_IN_FRAMES}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
);
