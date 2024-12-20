"use client";

import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { useRouter } from "next/navigation";
import { spawnWorldBox, createObstacle } from "./builders";
import toast from "react-hot-toast";
import axios from "axios";

const DialogueOverlay: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  const dialogueLines = [
    "No this cant be real...",
    "This looks too difficult",
    "Is there another way out of these walls?"
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
        backgroundColor: "rgba(0,0,0,0.7)",
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

  const handleLevelComplete = async (secretExit: boolean = false) => {
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
        secretPath: secretExit,
      });

      if (response.data) {
        toast.success(secretExit ? "Anomaly Detected..." : "Level Complete");
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

    // Secret exit with slight visibility
    const secretExitHole = Bodies.rectangle(50, 550, 20, 30, {
      isStatic: true,
      isSensor: true,
      render: { fillStyle: "rgba(255, 255, 255, 0.1)" }  // Slightly visible white
    });

    // Create extremely challenging obstacle platforms
    const redPlatforms = [
      Bodies.rectangle(400, 520, 190, 10, { isStatic: true, render: { fillStyle: "darkred" } }),
      Bodies.rectangle(600, 430, 140, 10, { isStatic: true, render: { fillStyle: "darkred" }, angle: Math.PI / 4 }),
      Bodies.rectangle(800, 330, 90, 10, { isStatic: true, render: { fillStyle: "darkred" }, angle: -Math.PI / 3 }),
      Bodies.rectangle(1200, 550, 190, 10, { isStatic: true, render: { fillStyle: "darkred" } }),
      Bodies.rectangle(1600, 470, 140, 10, { isStatic: true, render: { fillStyle: "darkred" }, angle: Math.PI / 2 }),
      Bodies.rectangle(2000, 530, 90, 10, { isStatic: true, render: { fillStyle: "darkred" } }),
      Bodies.rectangle(2350, 530, 140, 10, { isStatic: true, render: { fillStyle: "darkred" }, angle: -Math.PI / 4 }),
      Bodies.rectangle(2750, 480, 190, 10, { isStatic: true, render: { fillStyle: "darkred" } }),
    ];

    // More aggressive spinning obstacles
    const spinningObstacles = [
      createAdvancedSpinningObstacle(1800, 350, 2),
      createAdvancedSpinningObstacle(3500, 400, -2),
      createAdvancedSpinningObstacle(2200, 400, 1.5),
      createAdvancedSpinningObstacle(4100, 350, -1.5),
    ];

    // Extremely far and challenging end goal
    const mainEndGoal = Bodies.rectangle(5500, 530, 50, 100, {
      isStatic: true,
      isSensor: true,
      render: { fillStyle: "rgba(255,215,0,0.3)" },
    });

    // Collect all bodies to add to the world
    const worldBodies = [
      boxRef.current,
      ground,
      leftWall,
      rightWall,
      ...redPlatforms,
      ...spinningObstacles.flatMap((obs) => [obs.obstacle, obs.base]),
      secretExitHole,
      mainEndGoal
    ];

    // Add bodies to the world
    World.add(engineRef.current.world, worldBodies);

    // Add constraints
    World.add(
      engineRef.current.world,
      spinningObstacles.map((obs) => obs.constraint)
    );

    Events.on(engineRef.current, "collisionStart", (event) => {
      event.pairs.forEach((pair) => {
        if (pair.bodyA === boxRef.current || pair.bodyB === boxRef.current) {
          const otherBody =
            pair.bodyA === boxRef.current ? pair.bodyB : pair.bodyA;

          if (otherBody.position.y > boxRef.current!.position.y) {
            isGroundedRef.current = true;
          }

          // Handle secret exit hole
          if (otherBody === secretExitHole) {
            handleLevelComplete(true);
          }

          // Handle main end goal
          if (otherBody === mainEndGoal) {
            if (!levelComplete) {
              setLevelComplete(true);
              handleLevelComplete();
            }
          }

          // Check for hazards
          if (
            redPlatforms.includes(otherBody) ||
            spinningObstacles.some(
              (obs) => otherBody === obs.obstacle || otherBody === obs.base
            )
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

  const createAdvancedSpinningObstacle = (x: number, y: number, angularVelocity: number) => {
    const obstacle = Matter.Bodies.rectangle(x, y, 150, 15, {
      isStatic: false,
      render: { fillStyle: "crimson" },
      angularVelocity: angularVelocity,
    });
    const base = Matter.Bodies.rectangle(x, y - 100, 15, 50, {
      isStatic: true,
      render: { fillStyle: "darkred" },
    });
    const constraint = Matter.Constraint.create({
      pointA: { x: x, y: y - 100 },
      bodyB: obstacle,
      stiffness: 0.05,
    });
    return { obstacle, base, constraint };
  };

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