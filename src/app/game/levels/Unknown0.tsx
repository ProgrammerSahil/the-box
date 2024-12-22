"use client";

import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { useRouter } from "next/navigation";
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
    const Composite = Matter.Composite;

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

    // Create glitchy player
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

    // Create reality-breaking platforms with glitch effects
    const createGlitchPlatform = (x: number, y: number, width: number, height: number) => {
      return Bodies.rectangle(x, y, width, height, {
        isStatic: true,
        render: {
          fillStyle: "#333333",
          strokeStyle: "#ff0000",
          lineWidth: Math.random() > 0.5 ? 2 : 0
        }
      });
    };

    // Create a long series of increasingly difficult platforms
    const platforms = [];
    for (let i = 0; i < 20; i++) {
      const x = 300 + i * 300;
      const y = 500 - (Math.sin(i * 0.5) * 200);
      const width = 100 - (i * 2);
      platforms.push(createGlitchPlatform(x, y, width, 10));
    }

    const realityBreaks: Matter.Body[] = [];
    for (let i = 0; i < 10; i++) {
      const breakZone = Bodies.circle(800 + (i * 600), 300 + (Math.sin(i) * 100), 30, {
        isStatic: true,
        isSensor: true,
        render: {
          fillStyle: "#ff00ff",
          opacity: 0.5
        }
      });
      realityBreaks.push(breakZone);
    }

    // Create the final reality breach point
    const finalBreach = Bodies.rectangle(6000, 300, 50, 100, {
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
      ...platforms,
      ...realityBreaks,
      finalBreach
    ]);

    // Reality distortion effects
    glitchIntervalRef.current = setInterval(() => {
      if (playerRef.current && renderRef.current) {
        // Random visual glitches
        renderRef.current.options.background = Math.random() > 0.95 ? "#ffffff" : "#000000";
        
        // Distort gravity based on reality breaks triggered
        if (realityBreakRef.current > 0) {
          engineRef.current!.gravity.y = 1.8 + (Math.random() - 0.5) * (realityBreakRef.current * 0.2);
          engineRef.current!.gravity.x = (Math.random() - 0.5) * (realityBreakRef.current * 0.1);
        }

        // Add random glitch messages as reality breaks increase
        if (Math.random() > 0.9 && realityBreakRef.current > 0) {
          addGlitchMessage();
        }
      }
    }, 100);

    Events.on(engineRef.current, "collisionStart", (event) => {
      event.pairs.forEach((pair) => {
        if (pair.bodyA === playerRef.current || pair.bodyB === playerRef.current) {
          const otherBody = pair.bodyA === playerRef.current ? pair.bodyB : pair.bodyA;
          
          // Check for ground collision
          if (otherBody.position.y > playerRef.current!.position.y) {
            isGroundedRef.current = true;
          }

          // Check for reality break zones
          if (realityBreaks.includes(otherBody)) {
            realityBreakRef.current += 1;
            World.remove(engineRef.current!.world, otherBody);
            setShowGlitchText(true);
            setTimeout(() => setShowGlitchText(false), 1000);
            
            // Distort player
            if (playerRef.current) {
              playerRef.current.render.strokeStyle = `#${Math.floor(Math.random()*16777215).toString(16)}`;
            }
          }

          // Check for final breach
          if (otherBody === finalBreach) {
            handleLevelComplete();
          }
        }
      });
    });

    // Camera follow with increasing shake based on reality breaks
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
      clearInterval(glitchIntervalRef.current!);
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
      {showGlitchText && (
        <GlitchText 
          text="REALITY BREAK DETECTED" 
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)"
          }}
        />
      )}
      {glitchMessages.map((msg, index) => (
        <GlitchText
          key={index}
          text={msg.text}
          style={{
            top: `${msg.position.y}px`,
            left: `${msg.position.x}px`,
            opacity: 0.7
          }}
        />
      ))}
      <div ref={sceneRef} />
    </div>
  );
};

export default Unknown0;