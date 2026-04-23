import "./index.css";
import { CalculateMetadataFunction, Composition, Still } from "remotion";
import { MyComposition, VideoProps } from "./Composition";
import { content } from "./content";
import { ThumbnailYT } from "./thumbnails/ThumbnailYT";
import { ThumbnailIG } from "./thumbnails/ThumbnailIG";
import { ThumbnailReel } from "./thumbnails/ThumbnailReel";
import durationsJson from "../public/voiceover/durations.json";

const durations = durationsJson as Record<string, number>;

const sceneDurationSeconds = (sceneId: string): number => {
  const scene = content.scenes.find((s) => s.id === sceneId);
  if (!scene) return content.meta.fallbackSceneSeconds;
  if (content.voiceover.enabled && typeof durations[sceneId] === "number") {
    return durations[sceneId] + content.meta.sceneTailSeconds;
  }
  return scene.durationSeconds ?? content.meta.fallbackSceneSeconds;
};

const SCENE_DURATIONS_FRAMES = content.scenes.map((scene) =>
  Math.ceil(sceneDurationSeconds(scene.id) * content.meta.fps),
);

const TOTAL_FRAMES = SCENE_DURATIONS_FRAMES.reduce((sum, d) => sum + d, 0);

const calculateMetadata: CalculateMetadataFunction<VideoProps> = ({
  props,
}) => ({
  durationInFrames: TOTAL_FRAMES,
  props: { ...props, sceneDurationsFrames: SCENE_DURATIONS_FRAMES },
});

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id={content.meta.videoName}
        component={MyComposition}
        durationInFrames={TOTAL_FRAMES}
        fps={content.meta.fps}
        width={content.meta.width}
        height={content.meta.height}
        defaultProps={{ sceneDurationsFrames: SCENE_DURATIONS_FRAMES }}
        calculateMetadata={calculateMetadata}
      />

      {content.thumbnails.yt ? (
        <Still
          id="ThumbnailYT"
          component={ThumbnailYT}
          width={1280}
          height={720}
          defaultProps={{
            content: content.thumbnails.yt,
            primaryColor: content.brand.primaryColor,
          }}
        />
      ) : null}
      {content.thumbnails.ig ? (
        <Still
          id="ThumbnailIG"
          component={ThumbnailIG}
          width={1080}
          height={1080}
          defaultProps={{
            content: content.thumbnails.ig,
            primaryColor: content.brand.primaryColor,
          }}
        />
      ) : null}
      {content.thumbnails.reel ? (
        <Still
          id="ThumbnailReel"
          component={ThumbnailReel}
          width={1080}
          height={1920}
          defaultProps={{
            content: content.thumbnails.reel,
            primaryColor: content.brand.primaryColor,
          }}
        />
      ) : null}
    </>
  );
};
