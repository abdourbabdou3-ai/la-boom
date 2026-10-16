import React, { useEffect, useRef, useState, useCallback } from "react";
import { ArrowDown, Sparkles, Zap } from "lucide-react";

interface BuildYourLookScrollProps {
  id?: string;
  onShopClick?: () => void;
}

export default function BuildYourLookScroll({
  id = "build-your-look",
  onShopClick,
}: BuildYourLookScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Verified 27 GIF frames: ffout001.gif - ffout027.gif
  const [frames, setFrames] = useState<string[]>(() =>
    Array.from(
      { length: 27 },
      (_, i) => `/build-your-look-frames/ffout${String(i + 1).padStart(3, "0")}.gif`
    )
  );

  const [progress, setProgress] = useState(0);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [loadedRatio, setLoadedRatio] = useState(0);
  const [isFirstFrameReady, setIsFirstFrameReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Cached HTMLImageElements
  const imagesCacheRef = useRef<(HTMLImageElement | null)[]>([]);
  const lastDrawnIndexRef = useRef<number>(-1);
  const targetIndexRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  // Check for prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, []);

  // Fetch dynamic frames list from server (supports any additions)
  useEffect(() => {
    let isMounted = true;
    fetch("/api/build-your-look-frames")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.frames && Array.isArray(data.frames) && data.frames.length > 0) {
          setFrames(data.frames);
        }
      })
      .catch((err) => {
        console.warn("Using fallback static GIF frames list:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Drawing routine onto the canvas
  const drawImageToCanvas = useCallback(
    (img: HTMLImageElement) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      const cw = canvas.width;
      const ch = canvas.height;

      // Dark background matching image corners exactly (#101114)
      ctx.fillStyle = "#101114";
      ctx.fillRect(0, 0, cw, ch);

      // Consistent "contain" fit preserving original aspect ratio (800x444 -> ~1.8018)
      const imgW = img.naturalWidth || 800;
      const imgH = img.naturalHeight || 444;
      const imgRatio = imgW / imgH;
      const canvasRatio = cw / ch;

      let renderW = cw;
      let renderH = ch;
      let offsetX = 0;
      let offsetY = 0;

      if (canvasRatio > imgRatio) {
        // Viewport is wider than frame -> fit height
        renderH = ch;
        renderW = renderH * imgRatio;
        offsetX = (cw - renderW) / 2;
        offsetY = 0;
      } else {
        // Viewport is taller than frame (mobile / portrait) -> fit width
        renderW = cw;
        renderH = renderW / imgRatio;
        offsetX = 0;
        offsetY = (ch - renderH) / 2;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
    },
    []
  );

  // Resize canvas according to devicePixelRatio (max 2 for high performance)
  const updateCanvasDimensions = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const targetW = Math.round(rect.width * dpr);
    const targetH = Math.round(rect.height * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;

      // Redraw current frame
      const currentIdx = targetIndexRef.current;
      const currentImg = imagesCacheRef.current[currentIdx];
      if (currentImg) {
        drawImageToCanvas(currentImg);
      }
    }
  }, [drawImageToCanvas]);

  // Eager preloading of ALL 27 GIF frames simultaneously for instantaneous responsiveness
  useEffect(() => {
    if (!frames.length) return;

    let isCancelled = false;
    imagesCacheRef.current = new Array(frames.length).fill(null);
    let loadedCount = 0;

    frames.forEach((url, idx) => {
      const img = new Image();
      img.src = url;
      img.decoding = "async";

      img.onload = () => {
        if (isCancelled) return;
        imagesCacheRef.current[idx] = img;
        loadedCount++;
        setLoadedRatio(loadedCount / frames.length);

        if (idx === 0) {
          setIsFirstFrameReady(true);
          updateCanvasDimensions();
          drawImageToCanvas(img);
          lastDrawnIndexRef.current = 0;
        }

        // If the user's current target frame is this one, render it immediately
        if (targetIndexRef.current === idx || lastDrawnIndexRef.current === -1) {
          drawImageToCanvas(img);
          lastDrawnIndexRef.current = idx;
        }
      };

      img.onerror = () => {
        console.warn(`Failed loading frame ${idx}: ${url}`);
      };
    });

    return () => {
      isCancelled = true;
    };
  }, [frames, drawImageToCanvas, updateCanvasDimensions]);

  // Render frame index calculated to ensure the video completes cleanly before exiting
  const renderFrameForProgress = useCallback(
    (currentProgress: number) => {
      if (!frames.length) return;

      const total = frames.length;

      // Crucial fix: The video frames assemble from progress 0.0 -> 0.82
      // From 0.82 -> 1.0, the final frame (27/27) stays pinned and fully displayed with the complete look!
      const animProgress = Math.min(1, Math.max(0, currentProgress / 0.82));
      const targetIndex = Math.min(
        total - 1,
        Math.max(0, Math.round(animProgress * (total - 1)))
      );

      targetIndexRef.current = targetIndex;
      setCurrentFrameIndex(targetIndex);

      if (targetIndex === lastDrawnIndexRef.current) return;

      let imgToDraw = imagesCacheRef.current[targetIndex];
      let isExact = true;

      // If target image is still buffering, draw the nearest available frame
      if (!imgToDraw) {
        isExact = false;
        let bestDist = Infinity;
        let bestIndex = -1;
        for (let i = 0; i < total; i++) {
          if (imagesCacheRef.current[i]) {
            const dist = Math.abs(i - targetIndex);
            if (dist < bestDist) {
              bestDist = dist;
              bestIndex = i;
            }
          }
        }
        if (bestIndex >= 0) {
          imgToDraw = imagesCacheRef.current[bestIndex];
        }
      }

      if (imgToDraw) {
        drawImageToCanvas(imgToDraw);
        // Only lock lastDrawnIndex if the exact requested frame was drawn
        if (isExact) {
          lastDrawnIndexRef.current = targetIndex;
        } else {
          lastDrawnIndexRef.current = -1;
        }
      }
    },
    [frames.length, drawImageToCanvas]
  );

  // Synchronized scroll listener
  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const stickyTop = 68; // Account for fixed/sticky navbar height
      const visibleH = window.innerHeight - stickyTop;
      const scrollableDistance = rect.height - visibleH;

      if (scrollableDistance <= 0) return;

      const currentScroll = -rect.top + stickyTop;
      const rawProgress = currentScroll / scrollableDistance;
      const clampedProgress = Math.min(1, Math.max(0, rawProgress));

      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        setProgress(clampedProgress);
        renderFrameForProgress(clampedProgress);
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateCanvasDimensions, { passive: true });

    // Initial check
    handleScroll();
    updateCanvasDimensions();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateCanvasDimensions);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [renderFrameForProgress, updateCanvasDimensions]);

  // Stage visibility calculation
  const getStageStyle = (stageStart: number, stageEnd: number) => {
    if (progress < stageStart || progress > stageEnd) {
      return {
        opacity: 0,
        transform: "translateY(20px)",
        pointerEvents: "none" as const,
      };
    }

    const duration = stageEnd - stageStart;
    const fadeInWindow = duration * 0.22;
    const fadeOutWindow = duration * 0.22;

    let op = 1;
    let y = 0;

    if (progress < stageStart + fadeInWindow) {
      const factor = (progress - stageStart) / fadeInWindow;
      op = factor;
      y = (1 - factor) * 18;
    } else if (progress > stageEnd - fadeOutWindow && stageEnd < 0.98) {
      const factor = (stageEnd - progress) / fadeOutWindow;
      op = factor;
      y = -(1 - factor) * 18;
    } else {
      op = 1;
      y = 0;
    }

    return {
      opacity: Math.max(0, Math.min(1, op)),
      transform: `translateY(${y}px)`,
      pointerEvents: op > 0.5 ? ("auto" as const) : ("none" as const),
      transition: "opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
    };
  };



  return (
    <div
      id={id}
      ref={containerRef}
      className="relative w-full scroll-mt-24"
      style={{
        // Generous scroll track height ensuring all 27 frames reveal and complete cleanly
        height: reducedMotion ? "auto" : "clamp(280vh, 360vh, 400vh)",
      }}
    >
      {/* Sticky Viewport Container pinned cleanly below navbar */}
      <div className="sticky top-[68px] h-[calc(100vh-76px)] w-full flex items-center justify-center overflow-hidden rounded-[2rem] md:rounded-[2.5rem] bg-[#050505] text-[#FFFFFF] border border-white/10 shadow-2xl">
        {/* Subtle Luxury Radial Vignette */}
        <div className="absolute inset-0 bg-radial from-[#111111]/30 via-[#050505]/80 to-[#050505] pointer-events-none" />

        {/* HTML5 Canvas */}
        <canvas
          ref={canvasRef}
          className="relative z-10 w-full h-full block object-contain pointer-events-none"
        />

        {/* Subtle Progressive Loading Pill */}
        {loadedRatio < 0.95 && (
          <div className="absolute top-6 left-6 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111111]/85 backdrop-blur-md border border-white/10 text-xs text-white/90 font-medium tracking-wide shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[#315BFF] animate-pulse shadow-[0_0_8px_#315BFF]" />
            <span>جاري تجهيز الإطلالة {Math.round(loadedRatio * 100)}%</span>
          </div>
        )}

        {/* Initial Scroll Down Indicator */}
        <div
          className="absolute bottom-16 md:bottom-20 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none transition-opacity duration-500"
          style={{
            opacity: progress < 0.08 ? 1 : Math.max(0, 1 - (progress - 0.08) * 15),
          }}
        >
          <span className="text-[11px] uppercase tracking-widest text-white/70 font-semibold text-center">
            اسحب للأسفل لتشاهد اكتمال الإطلالة • SCROLL TO BUILD LOOK
          </span>
          <div className="w-8 h-8 rounded-full border border-[#315BFF]/40 flex items-center justify-center bg-[#111111]/60 backdrop-blur-sm animate-bounce text-[#315BFF]">
            <ArrowDown size={16} />
          </div>
        </div>

        {/* Brand Badge in Header */}
        <div className="absolute top-6 right-6 md:right-12 z-20 flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#111111]/85 backdrop-blur-md border border-white/10 text-xs font-bold tracking-wider text-white shadow-md">
          <span className="w-2 h-2 rounded-full bg-[#315BFF]" />
          <span>LA BOOM CLOTHES • 2026</span>
        </div>



        {/* 1. AT THE BEGINNING: BUILD YOUR LOOK. (~0% - 22%) */}
        <div
          style={getStageStyle(0.01, 0.22)}
          className="absolute z-20 top-20 md:top-32 right-6 md:right-16 max-w-sm md:max-w-md text-right pointer-events-none"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#315BFF]/15 border border-[#315BFF]/30 text-[#315BFF] text-xs font-bold mb-3 tracking-wider">
            <Sparkles size={13} />
            <span>ORIGINAL STREETWEAR</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white uppercase leading-none drop-shadow-md">
            BUILD YOUR LOOK.
          </h2>
          <p className="text-base sm:text-lg text-white/80 font-medium mt-2">
            One style. Your statement.
          </p>
          <p className="text-xs sm:text-sm text-[#315BFF] font-bold mt-1">
            اصنع إطلالتك • أسلوبك.. بصمتك الخاصة
          </p>
        </div>

        {/* 2. AT APPROXIMATELY 25%: EVERY PIECE MATTERS. (18% - 46%) */}
        <div
          style={getStageStyle(0.20, 0.46)}
          className="absolute z-20 bottom-24 md:bottom-28 left-6 md:left-16 max-w-sm md:max-w-md text-left pointer-events-none"
          dir="ltr"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white text-xs font-bold mb-3 tracking-wider">
            <Zap size={13} className="text-[#315BFF]" />
            <span>ATTENTION TO DETAILS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white uppercase leading-none drop-shadow-md">
            EVERY PIECE MATTERS.
          </h2>
          <p className="text-base sm:text-lg text-white/80 font-medium mt-2">
            Discover the details that complete your look.
          </p>
          <p className="text-xs sm:text-sm text-[#315BFF] font-bold mt-1" dir="rtl">
            كل قطعة تصنع الفرق • التفاصيل التي تصنع التميز
          </p>
        </div>

        {/* 3. AT APPROXIMATELY 60%: MADE TO STAND OUT. (48% - 74%) */}
        <div
          style={getStageStyle(0.48, 0.74)}
          className="absolute z-20 top-20 md:top-36 left-6 md:left-16 max-w-sm md:max-w-md text-left pointer-events-none"
          dir="ltr"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#315BFF]/15 border border-[#315BFF]/30 text-[#315BFF] text-xs font-bold mb-3 tracking-wider">
            <span>STREET READY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white uppercase leading-none drop-shadow-md">
            MADE TO STAND OUT.
          </h2>
          <p className="text-base sm:text-lg text-white/80 font-medium mt-2">
            Find your next favorite outfit.
          </p>
          <p className="text-xs sm:text-sm text-[#315BFF] font-bold mt-1" dir="rtl">
            صُمم لتبرز • إطلالتك المفضلة القادمة
          </p>
        </div>


      </div>
    </div>
  );
}
