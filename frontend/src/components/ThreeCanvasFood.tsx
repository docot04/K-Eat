import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Loader2, RotateCw } from "lucide-react";

export type FoodModelType = "burger" | "pizza" | "coffee" | "donut" | "dish";

interface ThreeCanvasFoodProps {
  modelType: FoodModelType;
  className?: string;
}

const MODEL_CONFIGS: Record<
  FoodModelType,
  {
    path: string;
    scaleMultiplier: number;
    yOffset: number;
    initialRotX: number;
  }
> = {
  burger: {
    path: "/models/burger.glb",
    scaleMultiplier: 2.15,
    yOffset: -0.22,
    initialRotX: 0.22,
  },
  pizza: {
    path: "/models/pizza.glb",
    scaleMultiplier: 2.3,
    yOffset: -0.32,
    initialRotX: 0.58,
  },
  coffee: {
    path: "/models/coffee.glb",
    scaleMultiplier: 2.2,
    yOffset: -0.38,
    initialRotX: 0.15,
  },
  donut: {
    path: "/models/donut.glb",
    scaleMultiplier: 2.1,
    yOffset: -0.25,
    initialRotX: 0.45,
  },
  dish: {
    path: "/models/dish.glb",
    scaleMultiplier: 2.25,
    yOffset: -0.32,
    initialRotX: 0.48,
  },
};

// Global cache of loaded GLTF scenes to make switching instantaneous
const modelCache: Map<string, THREE.Group> = new Map();

export const ThreeCanvasFood: React.FC<ThreeCanvasFoodProps> = ({
  modelType = "burger",
  className = "",
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const currentModelGroupRef = useRef<THREE.Group | null>(null);
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const reqIdRef = useRef<number>(0);

  // Initialize Three.js scene once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera: warm natural isometric view
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 1.6, 4.4);
    camera.lookAt(0, -0.05, 0);

    // 3. WebGL Renderer with High Dynamic Tone Mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 4. Refined Studio Lighting (Warm Natural Restaurant Photography Lighting)
    // Warm key light
    const ambientLight = new THREE.AmbientLight(0xfffdf7, 2.4);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xfffaf0, 3.2);
    mainKeyLight.position.set(4, 7, 4.5);
    scene.add(mainKeyLight);

    // Soft sky fill
    const softFillLight = new THREE.DirectionalLight(0xf1f5f9, 1.8);
    softFillLight.position.set(-4, 3.5, -2);
    scene.add(softFillLight);

    // Subtle edge rim light for contour separation
    const rimLight = new THREE.PointLight(0xffedd5, 1.8, 12);
    rimLight.position.set(0, -1.8, 3.2);
    scene.add(rimLight);

    const topAccent = new THREE.DirectionalLight(0xffffff, 1.2);
    topAccent.position.set(0, 8, 1);
    scene.add(topAccent);

    // 5. Natural Soft Contact Shadow on Studio Table
    const shadowGeo = new THREE.CircleGeometry(2.1, 64);
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const ctx = shadowCanvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createRadialGradient(128, 128, 15, 128, 128, 120);
      grad.addColorStop(0, "rgba(15, 23, 42, 0.38)");
      grad.addColorStop(0.35, "rgba(15, 23, 42, 0.16)");
      grad.addColorStop(0.7, "rgba(15, 23, 42, 0.05)");
      grad.addColorStop(1, "rgba(15, 23, 42, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.18;
    scene.add(shadowMesh);

    // 6. Smooth Animation Loop with Inertia / Damping
    let startTime = performance.now();
    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) * 0.001;

      if (currentModelGroupRef.current) {
        if (!isDraggingRef.current) {
          // Apply residual inertia decay
          velocityRef.current.x *= 0.94;
          velocityRef.current.y *= 0.94;

          currentModelGroupRef.current.rotation.y +=
            velocityRef.current.x + 0.0065;
          currentModelGroupRef.current.rotation.x = Math.max(
            -0.15,
            Math.min(
              0.65,
              currentModelGroupRef.current.rotation.x + velocityRef.current.y
            )
          );

          // Gentle human breathing bob
          const currentCfg = MODEL_CONFIGS[modelType] || MODEL_CONFIGS.burger;
          currentModelGroupRef.current.position.y =
            currentCfg.yOffset + Math.sin(elapsed * 1.6) * 0.025;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 7. Responsive Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const newW = container.clientWidth || 400;
      const newH = container.clientHeight || 400;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };

    window.addEventListener("resize", handleResize);

    // 8. Pointer Drag Interaction with Velocity Tracking
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      isDraggingRef.current = true;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      prevMouseRef.current = { x: clientX, y: clientY };
      velocityRef.current = { x: 0, y: 0 };
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current || !currentModelGroupRef.current) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - prevMouseRef.current.x;
      const deltaY = clientY - prevMouseRef.current.y;

      velocityRef.current = {
        x: deltaX * 0.008,
        y: deltaY * 0.005,
      };

      currentModelGroupRef.current.rotation.y += deltaX * 0.012;
      currentModelGroupRef.current.rotation.x = Math.max(
        -0.15,
        Math.min(0.65, currentModelGroupRef.current.rotation.x + deltaY * 0.007)
      );

      prevMouseRef.current = { x: clientX, y: clientY };
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
    };

    container.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);

    container.addEventListener("touchstart", handlePointerDown, {
      passive: true,
    });
    window.addEventListener("touchmove", handlePointerMove, { passive: true });
    window.addEventListener("touchend", handlePointerUp);

    return () => {
      cancelAnimationFrame(reqIdRef.current);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      container.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
      renderer.dispose();
      container.innerHTML = "";
    };
  }, []);

  // Effect to load / switch model on modelType changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    setIsLoading(true);
    setLoadError(null);

    // Remove previous model from scene
    if (currentModelGroupRef.current) {
      scene.remove(currentModelGroupRef.current);
      currentModelGroupRef.current = null;
    }

    const cfg = MODEL_CONFIGS[modelType] || MODEL_CONFIGS.burger;
    const loader = new GLTFLoader();

    // Check memory cache first
    if (modelCache.has(cfg.path)) {
      const cached = modelCache.get(cfg.path)!.clone(true);
      attachModelToScene(cached, cfg);
      setIsLoading(false);
      return;
    }

    loader.load(
      cfg.path,
      (gltf) => {
        const loadedGroup = gltf.scene;

        loadedGroup.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.roughness = Math.max(0.2, mat.roughness ?? 0.5);
              mat.needsUpdate = true;
            }
          }
        });

        modelCache.set(cfg.path, loadedGroup);
        const instance = loadedGroup.clone(true);
        attachModelToScene(instance, cfg);
        setIsLoading(false);
      },
      undefined,
      (err: unknown) => {
        console.error("Failed to load 3D GLB model:", cfg.path, err);
        const msg = err instanceof Error ? err.message : String(err);
        setLoadError(`Model load error: ${msg || "Failed to load"}`);
        setIsLoading(false);
      }
    );

    function attachModelToScene(
      group: THREE.Group,
      config: (typeof MODEL_CONFIGS)[FoodModelType]
    ) {
      // Accurately center pivot and scale to uniform bounding envelope
      const box = new THREE.Box3().setFromObject(group);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const targetSize = config.scaleMultiplier;
      const scale = targetSize / maxDim;

      group.position.x = -center.x * scale;
      group.position.y = -center.y * scale;
      group.position.z = -center.z * scale;
      group.scale.setScalar(scale);

      const wrapper = new THREE.Group();
      wrapper.add(group);
      wrapper.position.set(0, config.yOffset, 0);
      wrapper.rotation.x = config.initialRotX;

      scene!.add(wrapper);
      currentModelGroupRef.current = wrapper;
    }
  }, [modelType]);

  return (
    <div
      className={`relative flex flex-col items-center justify-center ${className}`}
    >
      {/* Loading state indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs z-30 pointer-events-none rounded-full">
          <Loader2 className="w-7 h-7 text-amber-400 animate-spin mb-2" />
          <span className="text-[11px] font-bold text-white tracking-wide">
            Rendering 3D Model...
          </span>
        </div>
      )}

      {/* Error notification if any */}
      {loadError && (
        <div className="absolute top-4 px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-500 text-rose-200 text-xs font-semibold z-30">
          {loadError}
        </div>
      )}

      {/* Main Three.js WebGL Mount Canvas */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        title="Interactive 3D WebGL • Click & drag horizontally or vertically to rotate"
      />

      {/* Discreet 360 Drag Hint */}
      <div className="absolute bottom-1 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/15 shadow-2xs text-[11px] font-medium text-slate-300 pointer-events-none select-none z-20">
        <RotateCw
          className="w-3 h-3 text-amber-400 animate-spin"
          style={{ animationDuration: "10s" }}
        />
        <span>Drag to rotate 360°</span>
      </div>
    </div>
  );
};
