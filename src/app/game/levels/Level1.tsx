"use client";

import React, { useEffect, useRef } from "react";
import Matter from "matter-js";
import { spawnWorldBox, createObstacle } from "./builders";

const Level1: React.FC = () => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const boxRef = useRef<Matter.Body | null>(null);
  const isGroundedRef = useRef(false);

  useEffect(() => {
    const Engine = Matter.Engine;
    const Render = Matter.Render;
    const World = Matter.World;
    const Bodies = Matter.Bodies;
    const Runner = Matter.Runner;
    const Events = Matter.Events;

    engineRef.current = Engine.create({ gravity: { x: 0, y: 1.2 } });
    renderRef.current = Render.create({
      element: sceneRef.current!,
      engine: engineRef.current,
      options: {
        width: 1200,
        height: 600,
        wireframes: false,
        background: "#000000", // White background
      },
    });
    runnerRef.current = Runner.create();

    boxRef.current = Bodies.rectangle(100, 500, 20, 20, {
      render: { fillStyle: "#ffffff" }, // Black playable cube
      frictionAir: 0.001,
      friction: 0.1,
      restitution: 0.1,
    });

    const { ground, leftWall, rightWall } = spawnWorldBox(Bodies); // Black walls and ground

    // **More Challenging Obstacles**
    const obstacle1 = createObstacle(Bodies, 800, 520, 50, 200, "#ffffff"); // Black obstacle
    const obstacle2 = createObstacle(Bodies, 1100, 480, 200, 50, "#ffffff"); // Black obstacle
    const obstacle3 = createObstacle(Bodies, 1400, 530, 100, 100, "#ffffff"); // Black obstacle
    const obstacle4 = createObstacle(Bodies, 1700, 500, 50, 50, "#ffffff"); // Black obstacle
    const obstacle5 = createObstacle(Bodies, 2000, 520, 150, 150, "#ffffff"); // Black obstacle
    const obstacle6 = createObstacle(Bodies, 2300, 480, 100, 100, "#ffffff"); // Black obstacle
    const obstacle7 = createObstacle(Bodies, 2600, 530, 50, 200, "#ffffff"); // Black obstacle

    const endGoal = Bodies.rectangle(3000, 530, 50, 100, {
      isStatic: true,
      isSensor: true,
      render: { fillStyle: "gold" }, // Black end goal
    });

    World.add(engineRef.current.world, [
      boxRef.current,
      ground,
      obstacle1,
      obstacle2,
      obstacle3,
      obstacle4,
      obstacle5,
      obstacle6,
      obstacle7,
      endGoal,
      leftWall,
      rightWall,
    ]);

    Events.on(engineRef.current, "collisionStart", (event) => {
      event.pairs.forEach((pair) => {
        if (pair.bodyA === boxRef.current || pair.bodyB === boxRef.current) {
          const otherBody =
            pair.bodyA === boxRef.current ? pair.bodyB : pair.bodyA;

          if (otherBody.position.y > boxRef.current!.position.y) {
            isGroundedRef.current = true;
          }
        }

        if (pair.bodyA === endGoal || pair.bodyB === endGoal) {
          console.log("Level Complete!");
          // Add logic to move to the next level or show a victory screen
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

    Events.on(engineRef.current, "afterUpdate", () => {
      if (boxRef.current && renderRef.current) {
        const box = boxRef.current;

        Render.lookAt(renderRef.current, {
          min: { x: box.position.x - 600, y: 0 },
          max: { x: box.position.x + 600, y: 600 },
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

export default Level1;
