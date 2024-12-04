"use client";

import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { useRouter } from "next/navigation";
import { spawnWorldBox, createObstacle } from "./builders";
import toast from "react-hot-toast";
import axios from "axios";

// Dialogue Overlay Component
const DialogueOverlay: React.FC<{ onDismiss: () => void }> = ({
  onDismiss,
}) => {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  const dialogueLines = [
    "Oohh... finally...",
    "Wait... again??",
    "That was not it??...",
    "These obstacles...",
    "They seem more... deliberate.",
    "Something is testing me.",
    "But why?",
    "I won't give up...",
    "I'll find a way...",
    "I am more than just a box...",
    "I will escape...",
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
        marginLeft: "200px",
        backgroundColor: "rgba(0,0,0,0)",
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
        <p style={{ fontSize: "16px", marginTop: "20px" }}></p>
      </div>
    </div>
  );
};

const Level3: React.FC = () => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const boxRef = useRef<Matter.Body | null>(null);
  const isGroundedRef = useRef(false);
  const router = useRouter();
  const [levelComplete, setLevelComplete] = React.useState(false);
  const [showDialogue, setShowDialogue] = useState(false);
  const [gameInitialized, setGameInitialized] = useState(false);

  const handleLevelComplete = async () => {
    try {
      const username = localStorage.getItem("username");
      if (!username) {
        toast.error("User not found");
        router.push("/login");
        return;
      }

      const response = await axios.post("/api/users/updateLevel", {
        username: username,
        newLevel: 4,
      });

      if (response.data) {
        toast.success("Level Complete!");
        router.push("/game/4");
      }
    } catch (error: any) {
      console.error("Error updating level:", error);
      toast.error("Failed to update level");
    }
  };

  const handleDismissDialogue = () => {
    setShowDialogue(false);
  };

  useEffect(() => {
    const Engine = Matter.Engine;
    const Render = Matter.Render;
    const World = Matter.World;
    const Bodies = Matter.Bodies;
    const Runner = Matter.Runner;
    const Events = Matter.Events;
    const Body = Matter.Body;

    engineRef.current = Engine.create({ gravity: { x: 0, y: 1.8 } });
    renderRef.current = Render.create({
      element: sceneRef.current!,
      engine: engineRef.current,
      options: {
        width: 1200,
        height: 600,
        wireframes: false,
        background: "#000000",
      },
    });
    runnerRef.current = Runner.create();

    boxRef.current = Bodies.rectangle(100, 500, 20, 20, {
      render: { fillStyle: "#ffffff" },
      frictionAir: 0.001,
      friction: 0.1,
      restitution: 0.2,
    });

    const { ground, leftWall, rightWall } = spawnWorldBox(Bodies);

    const obstacle1 = createObstacle(Bodies, 600, 520, 50, 200, "#ffffff");
    const obstacle2 = createObstacle(Bodies, 900, 400, 100, 50, "#ffffff");
    const obstacle3 = createObstacle(Bodies, 1500, 450, 100, 30, "#ffffff");

    const movingObstacle = Bodies.rectangle(1200, 500, 100, 20, {
      isStatic: false,
      render: { fillStyle: "#ffffff" },
    });

    const verticalSaw = Bodies.rectangle(2000, 300, 10, 300, {
      isStatic: true,
      render: { fillStyle: "red" },
    });

    const redLine1 = Bodies.rectangle(1700, 580, 200, 5, {
      isStatic: true,
      render: { fillStyle: "red" },
    });

    const redLine2 = Bodies.rectangle(2500, 580, 200, 5, {
      isStatic: true,
      render: { fillStyle: "red" },
    });

    const endGoal = Bodies.rectangle(3500, 530, 50, 100, {
      isStatic: true,
      isSensor: true,
      render: { fillStyle: "gold" },
    });

    World.add(engineRef.current.world, [
      boxRef.current,
      ground,
      leftWall,
      rightWall,
      obstacle1,
      obstacle2,
      obstacle3,
      movingObstacle,
      verticalSaw,
      redLine1,
      redLine2,
      endGoal,
    ]);

    Events.on(engineRef.current, "beforeUpdate", () => {
      const time = engineRef.current?.timing.timestamp || 0;

      Body.setPosition(movingObstacle, {
        x: 1200 + Math.sin(time * 0.003) * 200,
        y: 500,
      });

      Body.setPosition(verticalSaw, {
        x: 2000,
        y: 300 + Math.sin(time * 0.005) * 250,
      });
    });

    Events.on(engineRef.current, "collisionStart", (event) => {
      event.pairs.forEach((pair) => {
        if (pair.bodyA === boxRef.current || pair.bodyB === boxRef.current) {
          const otherBody =
            pair.bodyA === boxRef.current ? pair.bodyB : pair.bodyA;

          if (otherBody.position.y > boxRef.current!.position.y) {
            isGroundedRef.current = true;
          }

          if (otherBody === endGoal) {
            if (!levelComplete) {
              setLevelComplete(true);
              handleLevelComplete();
            }
          }

          if (
            otherBody === redLine1 ||
            otherBody === redLine2 ||
            otherBody === verticalSaw
          ) {
            toast.error("Hazard hit! Restarting...");
            Body.setPosition(boxRef.current, { x: 100, y: 500 });
          }
        }
      });
    });

    Events.on(engineRef.current, "afterUpdate", () => {
      if (boxRef.current && renderRef.current) {
        Render.lookAt(renderRef.current, {
          min: { x: boxRef.current.position.x - 600, y: 0 },
          max: { x: boxRef.current.position.x + 600, y: 600 },
        });
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!boxRef.current) return;

      switch (e.key) {
        case "ArrowUp":
        case " ":
          if (isGroundedRef.current) {
            Matter.Body.setVelocity(boxRef.current, {
              x: boxRef.current.velocity.x,
              y: -10,
            });
            isGroundedRef.current = false;
          }
          break;
        case "ArrowLeft":
          Matter.Body.applyForce(boxRef.current, boxRef.current.position, {
            x: -0.005,
            y: 0,
          });
          break;
        case "ArrowRight":
          Matter.Body.applyForce(boxRef.current, boxRef.current.position, {
            x: 0.005,
            y: 0,
          });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    Runner.run(runnerRef.current, engineRef.current);
    Render.run(renderRef.current);

    // Set game as initialized and trigger dialogue
    setGameInitialized(true);

    // Trigger dialogue after a short delay to ensure world is rendered
    const dialogueTimer = setTimeout(() => {
      setShowDialogue(true);
    }, 1000);

    return () => {
      clearTimeout(dialogueTimer);
      window.removeEventListener("keydown", handleKeyDown);
      if (renderRef.current) {
        Render.stop(renderRef.current);
        renderRef.current.canvas.remove();
        renderRef.current.canvas = null as any;
        renderRef.current.context = null as any;
        renderRef.current.textures = {};
      }
      if (runnerRef.current) {
        Runner.stop(runnerRef.current);
      }
      if (engineRef.current) {
        World.clear(engineRef.current.world, false);
        Engine.clear(engineRef.current);
      }
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Dialogue overlay conditionally rendered */}
      {gameInitialized && showDialogue && (
        <DialogueOverlay onDismiss={handleDismissDialogue} />
      )}

      <div ref={sceneRef} />
    </div>
  );
};

export default Level3;
