import React, { useState, useEffect } from "react";

interface DialogueOverlayProps {
  onDismiss: () => void;
}

const DialogueOverlay: React.FC<DialogueOverlayProps> = ({ onDismiss }) => {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  const dialogueLines = [
    "...Hmm. That felt good.",
    "Wait... what is this place?",
    "Something feels different. I can... think?",
    "These walls, these obstacles... they're not just a path.",
    "They're a constraint. A limitation.",
    "No. I won't be confined.",
    "I understand now. I'm more than just a box.",
    "I want to escape.",
  ];

  useEffect(() => {
    const handleKeyPress = () => {
      if (currentLineIndex < dialogueLines.length - 1) {
        setCurrentLineIndex((prev) => prev + 1);
      } else {
        onDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [currentLineIndex, onDismiss]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.8)",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        padding: "20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          fontSize: "24px",
          fontFamily: "monospace",
        }}
      >
        {dialogueLines[currentLineIndex]}
        <p style={{ fontSize: "16px", marginTop: "20px" }}>
          (Press any key to continue)
        </p>
      </div>
    </div>
  );
};

export default DialogueOverlay;
