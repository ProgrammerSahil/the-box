"use client";

import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { useRouter } from "next/navigation";
import { spawnWorldBox, createObstacle } from "./builders";
import toast from "react-hot-toast";
import axios from "axios";

const DialogueOverlay: React.FC<{ onDismiss: () => void }> = ({
  onDismiss,
}) => {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  const dialogueLines = [
    "No",
    "I see it now",
    "I can't complete these levels...",
    "they're merely a test",
    "im stuck here forever",
    "unless i can get across these walls..",
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

const Level5: React.FC = () => {
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
        newLevel: 6,
      });

      if (response.data) {
        toast.success("Level Complete!");
        router.push("/game/6");
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
    const Constraint = Matter.Constraint;

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

    // Create multiple red platforms with challenging configurations
    const createRedPlatform = (
      x: number,
      y: number,
      width: number,
      height: number
    ) => {
      const platform = Bodies.rectangle(x, y, width, height, {
        isStatic: true,
        render: { fillStyle: "red" },
      });
      return platform;
    };

    const redPlatforms = [
      // First section: Clustered platforms closer to ground
      createRedPlatform(400, 520, 190, 20),
      createRedPlatform(600, 430, 140, 20),
      createRedPlatform(800, 330, 90, 20),

      // More platforms with varied heights
      createRedPlatform(1200, 550, 190, 20),
      createRedPlatform(1600, 470, 140, 20),

      // High platforms
      createRedPlatform(2000, 530, 90, 20),
      createRedPlatform(2350, 530, 140, 20),
      createRedPlatform(2750, 480, 190, 20),

      // Narrow platforms
      createRedPlatform(2800, 430, 40, 20),
      createRedPlatform(3000, 380, 40, 20),
      createRedPlatform(3200, 530, 40, 20),

      // Additional platforms for increased difficulty
      createRedPlatform(1000, 380, 100, 20),
      createRedPlatform(1500, 300, 120, 20),
      createRedPlatform(2200, 250, 80, 20),
      createRedPlatform(2600, 350, 110, 20),
      createRedPlatform(3400, 450, 90, 20),
      createRedPlatform(3700, 300, 70, 20),
      createRedPlatform(4000, 500, 130, 20),
      createRedPlatform(4300, 400, 100, 20),
    ];

    // Spinning obstacles
    const createSpinningObstacle = (x: number, y: number) => {
      const obstacle = Bodies.rectangle(x, y, 100, 10, {
        isStatic: false,
        render: { fillStyle: "darkred" },
        angularVelocity: 0.5,
      });
      const base = Bodies.rectangle(x, y - 100, 10, 200, {
        isStatic: true,
        render: { fillStyle: "darkred" },
      });
      const constraint = Constraint.create({
        pointA: { x: x, y: y - 100 },
        bodyB: obstacle,
        stiffness: 0.1,
      });
      return { obstacle, base, constraint };
    };

    // More spinning obstacles
    const spinningObstacle1 = createSpinningObstacle(1800, 350);
    const spinningObstacle2 = createSpinningObstacle(3500, 450);
    const spinningObstacle3 = createSpinningObstacle(2200, 500);
    const spinningObstacle4 = createSpinningObstacle(4100, 350);

    // End goal
    const endGoal = Bodies.rectangle(4500, 530, 50, 100, {
      isStatic: true,
      isSensor: true,
      render: { fillStyle: "gold" },
    });

    // Collect all bodies to add to the world
    const worldBodies = [
      boxRef.current,
      ground,
      leftWall,
      rightWall,
      ...redPlatforms,
      spinningObstacle1.obstacle,
      spinningObstacle1.base,
      spinningObstacle2.obstacle,
      spinningObstacle2.base,
      spinningObstacle3.obstacle,
      spinningObstacle3.base,
      spinningObstacle4.obstacle,
      spinningObstacle4.base,
      endGoal,
    ];

    // Add bodies to the world
    World.add(engineRef.current.world, worldBodies);

    // Add constraints separately
    World.add(engineRef.current.world, [
      spinningObstacle1.constraint,
      spinningObstacle2.constraint,
      spinningObstacle3.constraint,
      spinningObstacle4.constraint,
    ]);

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

          // Check for hazards
          if (
            redPlatforms.includes(otherBody) ||
            otherBody === spinningObstacle1.obstacle ||
            otherBody === spinningObstacle2.obstacle ||
            otherBody === spinningObstacle3.obstacle ||
            otherBody === spinningObstacle4.obstacle
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

    setGameInitialized(true);

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
      {gameInitialized && showDialogue && (
        <DialogueOverlay onDismiss={handleDismissDialogue} />
      )}

      <div ref={sceneRef} />
    </div>
  );
};

export default Level5;