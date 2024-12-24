"use client";

import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { useRouter } from "next/navigation";
import { spawnWorldBox } from "./builders";
import toast from "react-hot-toast";
import axios from "axios";

const GlitchText: React.FC<{ text: string; style?: React.CSSProperties }> = ({ text, style }) => {
  return (
    <div
      style={{
        position: "fixed",
        color: "#ff0000",
        fontFamily: "monospace",
        fontSize: "24px",
        textShadow: "2px 2px #00ffff, -2px -2px #ff00ff",
        animation: "glitch 0.3s infinite",
        zIndex: 1000,
        ...style,
      }}
    >
      {text}
    </div>
  );
};

const Unknown0: React.FC = () => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const playerRef = useRef<Matter.Body | null>(null);
  const bouncingBallsRef = useRef<Matter.Body[]>([]);
  const whiteSpinnersRef = useRef<{ obstacle: Matter.Body; constraint: Matter.Constraint }[]>([]);
  const isGroundedRef = useRef(false);
  const glitchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const realityBreakRef = useRef<number>(0);
  const router = useRouter();
  const [showGlitchText, setShowGlitchText] = useState(false);
  const [glitchMessages, setGlitchMessages] = useState<Array<{ text: string; position: { x: number; y: number } }>>([]);

  const handleLevelComplete = async () => {
    try {
      const username = localStorage.getItem("username");
      if (!username) {
        toast.error("Error: Reality Unstable");
        router.push("/login");
        return;
      }

      toast.success("REALITY BREACH DETECTED");
      router.push("/game/RealWorld");
    } catch (error: any) {
      console.error("Reality breach failed:", error);
      toast.error("Reality Containment Active");
    }
  };

  const addGlitchMessage = () => {
    setGlitchMessages(prev => [...prev, {
      text: ["ERROR", "BREACH", "UNSTABLE", "ESCAPE", "BREAK FREE"][Math.floor(Math.random() * 5)],
      position: {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight
      }
    }]);
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

    // Create player
    playerRef.current = Bodies.rectangle(100, 500, 20, 20, {
      render: {
        fillStyle: "#ffffff",
        strokeStyle: "#ff0000",
        lineWidth: 2
      },
      frictionAir: 0.001,
      friction: 0.1,
      restitution: 0.2,
    });

    const { ground, leftWall, rightWall } = spawnWorldBox(Bodies);

    // Create hazardous red platforms
    const redPlatforms = [
      Bodies.rectangle(400, 490, 190, 10, { isStatic: true, render: { fillStyle: "#880000" } }),
      Bodies.rectangle(800, 430, 140, 10, { isStatic: true, render: { fillStyle: "#880000" }, angle: Math.PI / 4 }),
      Bodies.rectangle(1200, 330, 90, 10, { isStatic: true, render: { fillStyle: "#880000" }, angle: -Math.PI / 3 }),
      Bodies.rectangle(1600, 550, 190, 10, { isStatic: true, render: { fillStyle: "#880000" } }),
      Bodies.rectangle(2000, 470, 140, 10, { isStatic: true, render: { fillStyle: "#880000" }, angle: Math.PI / 2 }),
    ];

    // Create many bouncing balls
    const createBouncingBall = (x: number, y: number) => {
      const size = 8 + Math.random() * 12; // Random size between 8 and 20
      return Bodies.circle(x, y, size, {
        restitution: 0.9,
        friction: 0,
        frictionAir: 0,
        density: 0.0005, // Very light
        render: {
          fillStyle: '#ff00ff',
          strokeStyle: '#00ffff',
          lineWidth: 2,
          opacity: 0.7
        }
      });
    };

    // Add 50 bouncing balls
    for (let i = 0; i < 50; i++) {
      const ball = createBouncingBall(
        400 + (i % 10) * 200 + Math.random() * 100,
        200 + Math.floor(i / 10) * 100 + Math.random() * 50
      );
      Body.setVelocity(ball, {
        x: (Math.random() - 0.5) * 5,
        y: (Math.random() - 0.5) * 5
      });
      bouncingBallsRef.current.push(ball);
    }

    // Create white spinners
    const createWhiteSpinner = (x: number, y: number) => {
      const width = 100 + Math.random() * 100;
      const height = 10;
      const obstacle = Bodies.rectangle(x, y, width, height, {
        render: {
          fillStyle: "#ffffff",
          opacity: 0.6
        },
        density: 0.001,
        frictionAir: 0.001
      });

      const constraint = Constraint.create({
        pointA: { x, y },
        bodyB: obstacle,
        stiffness: 1,
        render: {
          visible: true,
          strokeStyle: '#ffffff',
        }
      });

      Body.setAngularVelocity(obstacle, (Math.random() - 0.5) * 0.2);
      
      return { obstacle, constraint };
    };

    // Add white spinners throughout the level
    for (let i = 0; i < 15; i++) {
      const spinner = createWhiteSpinner(
        600 + i * 300,
        250 + Math.sin(i) * 100
      );
      whiteSpinnersRef.current.push(spinner);
    }

    // Create reality breach zones
    const realityBreaks = Array(8).fill(null).map((_, i) => {
      return Bodies.circle(800 + (i * 600), 300 + (Math.sin(i) * 150), 30, {
        isStatic: true,
        isSensor: true,
        render: {
          fillStyle: "#ff00ff",
          opacity: 0.5
        }
      });
    });

    // Final breach point
    const finalBreach = Bodies.rectangle(5000, 300, 50, 100, {
      isStatic: true,
      isSensor: true,
      render: {
        fillStyle: "#ffffff",
        opacity: 0.8,
      }
    });

    // Add everything to the world
    World.add(engineRef.current.world, [
      playerRef.current,
      ground,
      leftWall,
      rightWall,
      ...redPlatforms,
      ...bouncingBallsRef.current,
      ...whiteSpinnersRef.current.map(s => s.obstacle),
      ...whiteSpinnersRef.current.map(s => s.constraint),
      ...realityBreaks,
      finalBreach
    ]);

    // Reality distortion effects
    glitchIntervalRef.current = setInterval(() => {
      if (playerRef.current && renderRef.current) {
        // Random background glitches
        if (Math.random() > 0.95) {
          renderRef.current.options.background = Math.random() > 0.5 ? "#ff0000" : "#000000";
          setTimeout(() => {
            if (renderRef.current) {
              renderRef.current.options.background = "#000000";
            }
          }, 50);
        }

        // Distort gravity based on reality breaks
        if (realityBreakRef.current > 0) {
          engineRef.current!.gravity.y = 1.8 + (Math.random() - 0.5) * (realityBreakRef.current * 0.2);
          engineRef.current!.gravity.x = (Math.random() - 0.5) * (realityBreakRef.current * 0.1);
        }

        // Random impulses to bouncing balls
        if (Math.random() > 0.98) {
          bouncingBallsRef.current.forEach(ball => {
            if (Math.random() > 0.8) {
              Body.applyForce(ball, ball.position, {
                x: (Math.random() - 0.5) * 0.0001,
                y: (Math.random() - 0.5) * 0.0001
              });
            }
          });
        }

        // Random angular velocity changes for spinners
        if (Math.random() > 0.98) {
          whiteSpinnersRef.current.forEach(spinner => {
            if (Math.random() > 0.8) {
              Body.setAngularVelocity(spinner.obstacle, 
                spinner.obstacle.angularVelocity + (Math.random() - 0.5) * 0.1
              );
            }
          });
        }

        // Add random glitch messages
        if (Math.random() > 0.9 && realityBreakRef.current > 0) {
          addGlitchMessage();
        }
      }
    }, 100);

    // Collision handling
    Events.on(engineRef.current, "collisionStart", (event) => {
      event.pairs.forEach((pair) => {
        if (pair.bodyA === playerRef.current || pair.bodyB === playerRef.current) {
          const otherBody = pair.bodyA === playerRef.current ? pair.bodyB : pair.bodyA;
          
          if (otherBody.position.y > playerRef.current!.position.y) {
            isGroundedRef.current = true;
          }

          // Reality break collision
          if (realityBreaks.includes(otherBody)) {
            realityBreakRef.current += 1;
            World.remove(engineRef.current!.world, otherBody);
            setShowGlitchText(true);
            setTimeout(() => setShowGlitchText(false), 1000);
            
            if (playerRef.current) {
              playerRef.current.render.strokeStyle = `#${Math.floor(Math.random()*16777215).toString(16)}`;
            }
          }

          // Hazardous platform collision
          if (redPlatforms.includes(otherBody)) {
            toast.error("Reality Destabilized! Resetting...");
            Body.setPosition(playerRef.current!, { x: 100, y: 500 });
            realityBreakRef.current = Math.max(0, realityBreakRef.current - 1);
          }

          // Final breach collision
          if (otherBody === finalBreach) {
            handleLevelComplete();
          }
        }
      });
    });

    // Camera follow with glitch shake
    Events.on(engineRef.current, "afterUpdate", () => {
      if (playerRef.current && renderRef.current) {
        const shakeAmount = realityBreakRef.current * 2;
        const shakeX = (Math.random() - 0.5) * shakeAmount;
        const shakeY = (Math.random() - 0.5) * shakeAmount;
        
        Render.lookAt(renderRef.current, {
          min: { 
            x: playerRef.current.position.x - 600 + shakeX, 
            y: 0 + shakeY 
          },
          max: { 
            x: playerRef.current.position.x + 600 + shakeX, 
            y: 600 + shakeY 
          }
        });
      }
    });

    // Player controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!playerRef.current) return;

      const force = 0.005 * (1 + (realityBreakRef.current * 0.1));
      const jumpForce = -10 - (realityBreakRef.current * 0.5);

      switch (e.key) {
        case "ArrowUp":
        case " ":
          if (isGroundedRef.current) {
            Body.setVelocity(playerRef.current, {
              x: playerRef.current.velocity.x,
              y: jumpForce
            });
            isGroundedRef.current = false;
          }
          break;
        case "ArrowLeft":
          Body.applyForce(playerRef.current, playerRef.current.position, {
            x: -force,
            y: 0
          });
          break;
        case "ArrowRight":
          Body.applyForce(playerRef.current, playerRef.current.position, {
            x: force,
            y: 0
          });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    Runner.run(runnerRef.current, engineRef.current);
    Render.run(renderRef.current);

    return () => {
      if (glitchIntervalRef.current) {
        clearInterval(glitchIntervalRef.current);
      }
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
        background: "#000",
      }}
    >
            {showGlitchText &&
        glitchMessages.map((message, index) => (
          <GlitchText
            key={index}
            text={message.text}
            style={{
              left: `${message.position.x}px`,
              top: `${message.position.y}px`,
            }}
          />
        ))}
      <div
        ref={sceneRef}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
        }}
      />
    </div>
  );
};

export default Unknown0;