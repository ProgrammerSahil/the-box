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

const FinalLevel: React.FC = () => {
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
        toast.error("User not found");
        router.push("/login");
        return;
      }

      const response = await axios.post("/api/users/updateLevel", {
        username: username,
        newLevel: 999, // Indicate game completion
      });

      if (response.data) {
        toast.success("REALITY RESTORED - GAME COMPLETE!");
        router.push("/victory");
      }
    } catch (error: any) {
      console.error("Error updating level:", error);
      toast.error("Reality Breach Failed");
    }
  };

  const addGlitchMessage = () => {
    setGlitchMessages(prev => [...prev, {
      text: ["ALMOST FREE", "FINAL PUSH", "BREAK THE LOOP", "ESCAPE", "REALITY BENDS"][Math.floor(Math.random() * 5)],
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

    // Create player with combined style from both levels
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

    // Create hazardous platforms (red and white combination)
    const platforms = [
      Bodies.rectangle(400, 490, 200, 10, { isStatic: true, render: { fillStyle: "#880000" } }),
      Bodies.rectangle(800, 430, 150, 10, { isStatic: true, render: { fillStyle: "#ffffff" }, angle: Math.PI / 4 }),
      Bodies.rectangle(1200, 330, 100, 10, { isStatic: true, render: { fillStyle: "#880000" }, angle: -Math.PI / 3 }),
      Bodies.rectangle(1600, 550, 200, 10, { isStatic: true, render: { fillStyle: "#ffffff" } }),
      Bodies.rectangle(2000, 470, 150, 10, { isStatic: true, render: { fillStyle: "#880000" }, angle: Math.PI / 2 }),
    ];

    // Create bouncing balls with combined effects
    const createBouncingBall = (x: number, y: number) => {
      const size = 10 + Math.random() * 15;
      return Bodies.circle(x, y, size, {
        restitution: 0.9,
        friction: 0,
        frictionAir: 0,
        density: 0.0005,
        render: {
          fillStyle: Math.random() > 0.5 ? '#ff00ff' : '#ffffff',
          strokeStyle: '#00ffff',
          lineWidth: 2,
          opacity: 0.7
        }
      });
    };

    // Add more bouncing balls
    for (let i = 0; i < 40; i++) {
      const ball = createBouncingBall(
        400 + (i % 10) * 200 + Math.random() * 100,
        200 + Math.floor(i / 10) * 100 + Math.random() * 50
      );
      Body.setVelocity(ball, {
        x: (Math.random() - 0.5) * 8,
        y: (Math.random() - 0.5) * 8
      });
      bouncingBallsRef.current.push(ball);
    }

    // Create spinning obstacles
    const createSpinner = (x: number, y: number) => {
      const width = 120 + Math.random() * 100;
      const height = 15;
      const obstacle = Bodies.rectangle(x, y, width, height, {
        render: {
          fillStyle: Math.random() > 0.5 ? "#ffffff" : "#880000",
          opacity: 0.8
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

      Body.setAngularVelocity(obstacle, (Math.random() - 0.5) * 0.3);
      
      return { obstacle, constraint };
    };

    // Add more spinners
    for (let i = 0; i < 20; i++) {
      const spinner = createSpinner(
        600 + i * 250,
        250 + Math.sin(i) * 120
      );
      whiteSpinnersRef.current.push(spinner);
    }

    // Create final goal area with combined styles
    const finalGoal = Bodies.rectangle(5000, 300, 100, 150, {
      isStatic: true,
      isSensor: true,
      render: {
        fillStyle: "#ffffff",
        strokeStyle: "#ff0000",
        lineWidth: 3,
        opacity: 0.9,
      }
    });

    // Add everything to the world
    World.add(engineRef.current.world, [
      playerRef.current,
      ground,
      leftWall,
      rightWall,
      ...platforms,
      ...bouncingBallsRef.current,
      ...whiteSpinnersRef.current.map(s => s.obstacle),
      ...whiteSpinnersRef.current.map(s => s.constraint),
      finalGoal
    ]);

    // Reality distortion and glitch effects
    glitchIntervalRef.current = setInterval(() => {
      if (playerRef.current && renderRef.current) {
        // Enhanced background glitches
        if (Math.random() > 0.93) {
          renderRef.current.options.background = ['#ff0000', '#000000', '#ffffff'][Math.floor(Math.random() * 3)];
          setTimeout(() => {
            if (renderRef.current) {
              renderRef.current.options.background = "#000000";
            }
          }, 50);
        }

        // Dynamic gravity distortions
        engineRef.current!.gravity.y = 1.8 + (Math.random() - 0.5) * 0.5;
        engineRef.current!.gravity.x = (Math.random() - 0.5) * 0.2;

        // Enhanced ball dynamics
        if (Math.random() > 0.95) {
          bouncingBallsRef.current.forEach(ball => {
            if (Math.random() > 0.7) {
              Body.applyForce(ball, ball.position, {
                x: (Math.random() - 0.5) * 0.0002,
                y: (Math.random() - 0.5) * 0.0002
              });
            }
          });
        }

        // Dynamic spinner behavior
        if (Math.random() > 0.95) {
          whiteSpinnersRef.current.forEach(spinner => {
            if (Math.random() > 0.7) {
              Body.setAngularVelocity(spinner.obstacle, 
                spinner.obstacle.angularVelocity + (Math.random() - 0.5) * 0.15
              );
            }
          });
        }

        // Add glitch messages more frequently
        if (Math.random() > 0.85) {
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

          // Handle hazardous platform collisions
          if (platforms.includes(otherBody) && otherBody.render.fillStyle === "#880000") {
            toast.error("Reality Destabilized!");
            Body.setPosition(playerRef.current!, { x: 100, y: 500 });
          }

          // Final goal collision
          if (otherBody === finalGoal) {
            handleLevelComplete();
          }
        }
      });
    });

    // Camera follow with enhanced shake
    Events.on(engineRef.current, "afterUpdate", () => {
      if (playerRef.current && renderRef.current) {
        const shakeX = (Math.random() - 0.5) * 4;
        const shakeY = (Math.random() - 0.5) * 4;
        
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

    // Enhanced player controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!playerRef.current) return;

      const force = 0.005;
      const jumpForce = -10;

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

export default FinalLevel;