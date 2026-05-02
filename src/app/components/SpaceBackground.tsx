import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";

export function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let stars: { x: number; y: number; z: number; radius: number }[] = [];
    const numStars = 400;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resize);
    resize();

    // Initialize stars
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * canvas.width - canvas.width / 2,
        y: Math.random() * canvas.height - canvas.height / 2,
        z: Math.random() * canvas.width,
        radius: Math.random() * 1.5,
      });
    }

    const draw = () => {
      ctx.fillStyle = "rgba(5, 5, 8, 0.4)"; // Deep space black/dark blue with trails
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      stars.forEach((star) => {
        // Move stars towards the viewer (decrease z)
        star.z -= 0.5;
        if (star.z <= 0) {
          star.z = canvas.width;
          star.x = Math.random() * canvas.width - centerX;
          star.y = Math.random() * canvas.height - centerY;
        }

        const projectX = (star.x / star.z) * canvas.width + centerX;
        const projectY = (star.y / star.z) * canvas.width + centerY;
        const size = (1 - star.z / canvas.width) * star.radius * 3;

        // Draw star
        ctx.beginPath();
        ctx.arc(projectX, projectY, size, 0, Math.PI * 2);

        // Slightly blueish/white stars
        const opacity = 1 - star.z / canvas.width;
        ctx.fillStyle = `rgba(220, 230, 255, ${opacity})`;
        ctx.fill();
      });

      // Draw subtle "black hole" glow in the center
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        canvas.height / 1.5,
      );
      gradient.addColorStop(0, "rgba(0, 0, 0, 0.8)");
      gradient.addColorStop(0.2, "rgba(20, 10, 40, 0.3)"); // Subtle purple/blue glow
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none bg-[#030305] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Tesseract/Grid subtle overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
          backgroundSize: "4rem 4rem",
          transform:
            "perspective(1000px) rotateX(60deg) translateY(-100px) translateZ(-200px)",
          transformOrigin: "top center",
        }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(3,3,5,1)_80%)]" />
    </div>
  );
}
