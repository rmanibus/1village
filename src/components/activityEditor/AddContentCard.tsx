import React from "react";

import { ButtonBase, Card } from "@material-ui/core";

import ImageIcon from "src/svg/editor/image_icon.svg";
import TextIcon from "src/svg/editor/text_icon.svg";
import VideoIcon from "src/svg/editor/video_icon.svg";

import type { EditorTypes } from "./editing.types";

interface AddContentCardProps {
  addContent?(type: EditorTypes): void;
}

export const AddContentCard: React.FC<AddContentCardProps> = ({ addContent = () => {} }) => {
  return (
    <Card style={{ display: "inline-block" }}>
      <div style={{ display: "inline-flex", padding: "0.2rem 1rem", alignItems: "center" }}>
        <span className="text text--bold" style={{ margin: "0 0.5rem" }}>
          Ajouter à votre description :
        </span>
        {/* <Divider flexItem orientation="vertical" style={{ margin: "0 1rem", backgroundColor: "#4c3ed9" }} /> */}
        <ButtonBase
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            margin: "0 0.5rem",
            padding: "0.2rem",
            borderRadius: "5px",
          }}
          onClick={() => {
            addContent("text");
          }}
        >
          <TextIcon height="1.25rem" />
          <span className="text text--small" style={{ marginTop: "0.1rem" }}>
            Texte
          </span>
        </ButtonBase>
        <ButtonBase
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            margin: "0 0.5rem",
            padding: "0.2rem",
            borderRadius: "5px",
          }}
          onClick={() => {
            addContent("image");
          }}
        >
          <ImageIcon height="1.25rem" />
          <span className="text text--small" style={{ marginTop: "0.1rem" }}>
            Image
          </span>
        </ButtonBase>
        <ButtonBase
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            margin: "0 0.5rem",
            padding: "0.2rem",
            borderRadius: "5px",
          }}
          onClick={() => {
            addContent("video");
          }}
        >
          <VideoIcon height="1.25rem" />
          <span className="text text--small" style={{ marginTop: "0.1rem" }}>
            Vidéo
          </span>
        </ButtonBase>
      </div>
    </Card>
  );
};