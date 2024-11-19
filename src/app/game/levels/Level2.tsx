"use client";

import React, { useEffect, useRef } from "react";
import Matter from "matter-js";
import { useRouter } from "next/navigation";
import { spawnWorldBox, createObstacle } from "./builders";
import toast from "react-hot-toast";
import axios from "axios";

const Level2: React.FC = () => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const boxRef = useRef<Matter.Body | null>(null);
  const isGroundedRef = useRef(false);
  const router = useRouter();
  const [levelComplete, setLevelComplete] = React.useState(false);

  const handleLevelComplete = async () => {
    try {
      const username = localStorage.getItem("username");

      if (!username) {
        toast.error("User not found");
        router.push("/login");
        return;
      }

      // Update the level in the database
      const response = await axios.post("/api/users/updateLevel", {
        username: username,
        newLevel: 3, // Next level number
      });

      if (response.data) {
        toast.success("Level Complete!");
        // Navigate to the next level
        router.push("/game/3");
      }
    } catch (error: any) {
      console.error("Error updating level:", error);
      toast.error("Failed to update level");
    }
  };

  useEffect(() => {
    // Matter.js modules
    const Engine = Matter.Engine;
    const Render = Matter.Render;
    const World = Matter.World;
    const Bodies = Matter.Bodies;
    const Runner = Matter.Runner;
    const Events = Matter.Events;
    const Body = Matter.Body;

    // Initialize engine, renderer, and runner
    engineRef.current = Engine.create({ gravity: { x: 0, y: 1.5 } });
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

    // Create player box
    boxRef.current = Bodies.rectangle(100, 500, 20, 20, {
      render: { fillStyle: "#ffffff" },
      frictionAir: 0.001,
      friction: 0.1,
      restitution: 0.2,
    });

    // Spawn world elements
    const { ground, leftWall, rightWall } = spawnWorldBox(Bodies);

    // Dynamic and moving obstacles
    const obstacle1 = createObstacle(Bodies, 600, 520, 50, 200, "#ffffff");
    const obstacle2 = createObstacle(Bodies, 900, 400, 100, 50, "#ffffff");

    const movingPlatform = Bodies.rectangle(1400, 400, 200, 20, {
      isStatic: false,
      render: { fillStyle: "#ffffff" },
    });

    const rotatingObstacle = Bodies.rectangle(1800, 450, 150, 20, {
      isStatic: false,
      render: { fillStyle: "#ffffff" },
    });

    // Red line hazard
    const redLine = Bodies.rectangle(1400, 577, 200, 5, {
      isStatic: true,
      render: { fillStyle: "red" },
    });

    // End goal
    const endGoal = Bodies.rectangle(2200, 530, 50, 100, {
      isStatic: true,
      isSensor: true,
      render: { fillStyle: "gold" },
    });

    // Add all bodies to the world
    World.add(engineRef.current.world, [
      boxRef.current,
      ground,
      leftWall,
      rightWall,
      obstacle1,
      obstacle2,
      movingPlatform,
      rotatingObstacle,
      redLine,
      endGoal,
    ]);

    // Moving platform motion
    Events.on(engineRef.current, "beforeUpdate", () => {
      const time = engineRef.current?.timing.timestamp || 0;
      Body.setPosition(movingPlatform, {
        x: 1400 + Math.sin(time * 0.005) * 200,
        y: 400, // Lowered platform for accessibility
      });

      Body.rotate(rotatingObstacle, 0.05);
    });

    // Collision events
    Events.on(engineRef.current, "collisionStart", (event) => {
      event.pairs.forEach((pair) => {
        if (pair.bodyA === boxRef.current || pair.bodyB === boxRef.current) {
          const otherBody =
            pair.bodyA === boxRef.current ? pair.bodyB : pair.bodyA;

          // Check if grounded
          if (otherBody.position.y > boxRef.current!.position.y) {
            isGroundedRef.current = true;
          }

          // Check for collision with end goal
          if (
            (otherBody === endGoal || pair.bodyB === endGoal) &&
            (pair.bodyA === boxRef.current || pair.bodyB === boxRef.current)
          ) {
            if (!levelComplete) {
              setLevelComplete(true);
              handleLevelComplete();
            }
          }

          // Check for collision with red line
          if (otherBody === redLine) {
            toast.error("You hit a hazard! Restarting...");
            Body.setPosition(boxRef.current, {
              x: 100,
              y: 500,
            });
          }
        }
      });
    });

    Events.on(engineRef.current, "collisionEnd", (event) => {
      event.pairs.forEach((pair) => {
        if (pair.bodyA === boxRef.current || pair.bodyB === boxRef.current) {
          const otherBody =
            pair.bodyA === boxRef.current ? pair.bodyB : pair.bodyA;
          if (otherBody.position.y > boxRef.current!.position.y) {
            isGroundedRef.current = false;
          }
        }
      });
    });

    // Camera tracking for player box
    Events.on(engineRef.current, "afterUpdate", () => {
      if (boxRef.current && renderRef.current) {
        const box = boxRef.current;

        Render.lookAt(renderRef.current, {
          min: { x: box.position.x - 600, y: 0 },
          max: { x: box.position.x + 600, y: 600 },
        });
      }
    });

    // Handle keyboard inputs
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

    // Add keyboard event listener
    window.addEventListener("keydown", handleKeyDown);

    // Start engine and renderer
    Runner.run(runnerRef.current, engineRef.current);
    Render.run(renderRef.current);

    // Cleanup on component unmount
    return () => {
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
      <div ref={sceneRef} />
      <div
        style={{ position: "absolute", top: 20, left: 20, color: "black" }}
      ></div>
    </div>
  );
};

export default Level2;
