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
    "What??",
    "This can't keep on going...",
    "Am I gonna have to get through this too??",
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

const Level4: React.FC = () => {
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
        newLevel: 5,
      });

      if (response.data) {
        toast.success("Level Complete!");
        router.push("/game/5");
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

    // Underground maze of deadly obstacles
    const createUndergroundObstacle = (
      x: number,
      y: number,
      width: number,
      height: number,
      color: string
    ) => {
      return Bodies.rectangle(x, y, width, height, {
        isStatic: true,
        render: { fillStyle: color },
      });
    };

    const undergroundObstacles = [
      // First underground section
      createUndergroundObstacle(650, 570, 10, 100, "red"),
      createUndergroundObstacle(674, 520, 54, 10, "red"),
      createUndergroundObstacle(700, 570, 10, 100, "red"),

      // Spinning blades
      Bodies.rectangle(1200, 400, 5, 120, {
        isStatic: true,
        render: { fillStyle: "red" },
      }),

      // Moving platforms
      Bodies.rectangle(1300, 520, 150, 20, {
        isStatic: false,
        render: { fillStyle: "red" },
      }),

      // Narrow passages
      createUndergroundObstacle(2050, 575, 10, 150, "red"),
      createUndergroundObstacle(2200, 450, 10, 150, "red"),
    ];

    // Create pendulum traps
    const createPendulum = (x: number, y: number) => {
      const pendulumHead = Bodies.rectangle(x - 20, y - 20, 50, 20, {
        render: { fillStyle: "red" },
        isStatic: false,
        angularVelocity: 1,
      });
      const pendulumBase = Bodies.rectangle(x, y - 200, 5, 200, {
        isStatic: true,
        render: { fillStyle: "red" },
      });
      const pendulumConstraint = Constraint.create({
        pointA: { x: x, y: y - 200 },
        bodyB: pendulumHead,
        stiffness: 0.1,
      });

      return { pendulumHead, pendulumBase, pendulumConstraint };
    };

    const pendulum2 = createPendulum(3000, 550);

    // Extremely long level with multiple challenging sections
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
      ...undergroundObstacles,
      pendulum2.pendulumHead,
      pendulum2.pendulumBase,
      endGoal,
    ];

    // Add bodies to the world
    World.add(engineRef.current.world, worldBodies);

    // Add constraints separately
    World.add(engineRef.current.world, [pendulum2.pendulumConstraint]);

    Events.on(engineRef.current, "beforeUpdate", () => {
      const time = engineRef.current?.timing.timestamp || 0;

      // Move platforms and add dynamic elements
      const movingPlatform = undergroundObstacles[4];
      Body.setPosition(movingPlatform, {
        x: 1300 + Math.sin(time * 0.003) * 200,
        y: 520,
      });

      // Rotate pendulums
      Body.rotate(pendulum2.pendulumHead, -0.05);
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

          // Check for hazards
          if (
            undergroundObstacles.includes(otherBody) ||
            otherBody === pendulum2.pendulumHead
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

export default Level4;
