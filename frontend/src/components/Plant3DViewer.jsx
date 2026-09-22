import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const POT_COLORS = [
  { id: "terracotta", name: "Terracotta", color: 0xb85d43, hex: "#b85d43" },
  { id: "emerald", name: "Forest Emerald", color: 0x1b4332, hex: "#1b4332" },
  { id: "obsidian", name: "Matte Obsidian", color: 0x212529, hex: "#212529" },
  { id: "marble", name: "Nordic Ceramic", color: 0xf8f9fa, hex: "#f8f9fa" },
];

const LIGHT_PRESETS = [
  { id: "daylight", name: "Daylight ☀️", bg: 0x0f172a, lightColor: 0xffffff, intensity: 1.2 },
  { id: "golden", name: "Golden Hour 🌅", bg: 0x1c1917, lightColor: 0xffa500, intensity: 1.4 },
  { id: "studio", name: "Studio 💡", bg: 0x090d16, lightColor: 0x60a5fa, intensity: 1.0 },
];

export default function Plant3DViewer({ plantName = "Fiddle Leaf Fig", onClose }) {
  const mountRef = useRef(null);
  const [activePot, setActivePot] = useState("terracotta");
  const [activeLight, setActiveLight] = useState("daylight");
  const [arMode, setArMode] = useState(false);
  const [isRotating, setIsRotating] = useState(true);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);

  // References for Three.js manipulation
  const potMeshRef = useRef(null);
  const dirLightRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a101d);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 4.2);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(3, 5, 3);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    const rimLight = new THREE.DirectionalLight(0x52b788, 0.6);
    rimLight.position.set(-3, 2, -3);
    scene.add(rimLight);

    // 4. Ground Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(6, 6);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.1;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // 5. Plant Root Group
    const plantGroup = new THREE.Group();
    scene.add(plantGroup);

    // Pot Geometry
    const potPoints = [];
    potPoints.push(new THREE.Vector2(0.45, -1.0));
    potPoints.push(new THREE.Vector2(0.65, -0.2));
    potPoints.push(new THREE.Vector2(0.7, -0.15));
    potPoints.push(new THREE.Vector2(0.65, -0.15));
    const potGeo = new THREE.LatheGeometry(potPoints, 32);
    const potMat = new THREE.MeshStandardMaterial({
      color: POT_COLORS[0].color,
      roughness: 0.4,
      metalness: 0.1,
    });
    const potMesh = new THREE.Mesh(potGeo, potMat);
    potMesh.castShadow = true;
    potMesh.receiveShadow = true;
    plantGroup.add(potMesh);
    potMeshRef.current = potMesh;

    // Soil
    const soilGeo = new THREE.CylinderGeometry(0.64, 0.55, 0.1, 32);
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x2b1d14, roughness: 0.9 });
    const soilMesh = new THREE.Mesh(soilGeo, soilMat);
    soilMesh.position.y = -0.2;
    plantGroup.add(soilMesh);

    // Main Stem
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.2, 0),
      new THREE.Vector3(0.05, 0.4, 0.02),
      new THREE.Vector3(-0.04, 0.9, -0.02),
      new THREE.Vector3(0.02, 1.4, 0),
    ]);
    const stemGeo = new THREE.TubeGeometry(stemCurve, 24, 0.04, 12, false);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x3e5622, roughness: 0.7 });
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    stemMesh.castShadow = true;
    plantGroup.add(stemMesh);

    // Leaves Generation
    const leafNodes = [];
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.quadraticCurveTo(0.2, 0.2, 0.35, 0.6);
    leafShape.quadraticCurveTo(0.4, 0.9, 0, 1.3);
    leafShape.quadraticCurveTo(-0.4, 0.9, -0.35, 0.6);
    leafShape.quadraticCurveTo(-0.2, 0.2, 0, 0);

    const leafGeo = new THREE.ShapeGeometry(leafShape);
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x2d6a4f,
      side: THREE.DoubleSide,
      roughness: 0.35,
      metalness: 0.05,
    });

    const leafPositions = [
      { y: 0.3, rotY: 0.2, rotX: 0.6, scale: 0.7 },
      { y: 0.5, rotY: 2.1, rotX: 0.5, scale: 0.8 },
      { y: 0.7, rotY: 4.2, rotX: 0.55, scale: 0.9 },
      { y: 0.9, rotY: 1.0, rotX: 0.45, scale: 0.95 },
      { y: 1.1, rotY: 3.1, rotX: 0.4, scale: 0.85 },
      { y: 1.3, rotY: 5.2, rotX: 0.35, scale: 0.75 },
      { y: 1.45, rotY: 0.5, rotX: 0.25, scale: 0.65 },
      { y: 1.45, rotY: 2.8, rotX: 0.25, scale: 0.65 },
    ];

    leafPositions.forEach((pos, idx) => {
      const leafGroup = new THREE.Group();
      leafGroup.position.set(0, pos.y, 0);
      leafGroup.rotation.y = pos.rotY;

      const leaf = new THREE.Mesh(leafGeo, leafMat.clone());
      leaf.material.color.setHex(idx % 2 === 0 ? 0x2d6a4f : 0x40916c);
      leaf.rotation.x = pos.rotX;
      leaf.scale.set(pos.scale, pos.scale, pos.scale);
      leaf.castShadow = true;
      leaf.receiveShadow = true;

      leafGroup.add(leaf);
      plantGroup.add(leafGroup);
      leafNodes.push({ group: leafGroup, baseRotX: pos.rotX, speed: 1.5 + idx * 0.2 });
    });

    // 6. Interactive Drag Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onPointerDown = (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      plantGroup.rotation.y += deltaX * 0.01;
      camera.position.y = Math.max(0.5, Math.min(3.5, camera.position.y - deltaY * 0.01));
      camera.lookAt(0, 0.4, 0);
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      camera.position.z = Math.max(2.2, Math.min(6.5, camera.position.z + e.deltaY * 0.003));
    };

    const dom = renderer.domElement;
    dom.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    dom.addEventListener("wheel", onWheel, { passive: false });

    // 7. Animation Loop (Wind Sway & Smooth Rotation)
    let clock = new THREE.Clock();
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Gentle continuous rotation when idle
      if (isRotating && !isDragging) {
        plantGroup.rotation.y += 0.004;
      }

      // Wind sway on individual leaves
      leafNodes.forEach((node, i) => {
        const sway = Math.sin(elapsed * node.speed + i) * 0.03;
        node.group.children[0].rotation.x = node.baseRotX + sway;
      });

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      dom.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      if (container.contains(dom)) container.removeChild(dom);
      renderer.dispose();
    };
  }, [isRotating]);

  // Handle Pot Color Change
  const handlePotChange = (colorId) => {
    setActivePot(colorId);
    const chosen = POT_COLORS.find((c) => c.id === colorId);
    if (chosen && potMeshRef.current) {
      potMeshRef.current.material.color.setHex(chosen.color);
    }
  };

  // Handle Lighting Change
  const handleLightChange = (lightId) => {
    setActiveLight(lightId);
    const preset = LIGHT_PRESETS.find((l) => l.id === lightId);
    if (preset && dirLightRef.current && sceneRef.current) {
      dirLightRef.current.color.setHex(preset.lightColor);
      dirLightRef.current.intensity = preset.intensity;
      if (!arMode) {
        sceneRef.current.background = new THREE.Color(preset.bg);
      }
    }
  };

  // Toggle AR Mode with Camera Projection
  const handleToggleAR = async () => {
    if (!arMode) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        if (sceneRef.current) {
          sceneRef.current.background = null; // transparent background for camera feed
        }
        setArMode(true);
      } catch (_err) {
        alert("Camera access denied or unavailable on this device. Simulating AR room backdrop.");
        setArMode(true);
      }
    } else {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
      }
      const preset = LIGHT_PRESETS.find((l) => l.id === activeLight);
      if (sceneRef.current && preset) {
        sceneRef.current.background = new THREE.Color(preset.bg);
      }
      setArMode(false);
    }
  };

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Download 3D Snapshot
  const handleSnapshot = () => {
    if (!rendererRef.current) return;
    const dataURL = rendererRef.current.domElement.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataURL;
    a.download = `${plantName.toLowerCase().replace(/\s+/g, "_")}_3d_view.png`;
    a.click();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10000,
      background: "rgba(3, 7, 18, 0.88)",
      backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem"
    }}>
      <div style={{
        position: "relative", width: "100%", maxWidth: "880px", height: "650px",
        background: "linear-gradient(145deg, #0d1527, #070c18)",
        borderRadius: "1.25rem", border: "1px solid rgba(82, 183, 136, 0.25)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(45, 106, 79, 0.2)",
        display: "flex", flexDirection: "column", overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{
          padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(255, 255, 255, 0.02)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.5rem" }}>🪴</span>
            <div>
              <h3 style={{ margin: 0, color: "#fff", fontSize: "1.15rem", fontWeight: 700 }}>
                {plantName} — 3D & AR Studio
              </h3>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>
                360° Real-time Botanical Model & Augmented Reality Floor Projection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.08)", border: "none", color: "#cbd5e1",
              width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem"
            }}
          >
            ✕
          </button>
        </div>

        {/* Main 3D Canvas Area */}
        <div style={{ position: "relative", flex: 1, width: "100%", overflow: "hidden" }}>
          {/* Real Video AR Background */}
          {arMode && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                position: "absolute", inset: 0, width: "100%", height: "100%",
                objectFit: "cover", zIndex: 1
              }}
            />
          )}

          {/* Three.js Canvas Container */}
          <div
            ref={mountRef}
            style={{
              position: "absolute", inset: 0, zIndex: 2,
              cursor: "grab", touchAction: "none"
            }}
          />

          {/* Overlay Floating Controls */}
          <div style={{
            position: "absolute", top: "1rem", left: "1rem", zIndex: 10,
            display: "flex", flexDirection: "column", gap: "0.5rem"
          }}>
            {/* AR Mode Toggle */}
            <button
              onClick={handleToggleAR}
              style={{
                background: arMode ? "#e11d48" : "#2d6a4f",
                color: "#fff", border: "none", padding: "0.6rem 1rem",
                borderRadius: "2rem", fontWeight: 600, fontSize: "0.85rem",
                cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem",
                boxShadow: "0 4px 15px rgba(0,0,0,0.3)"
              }}
            >
              <span>{arMode ? "📷 Exit AR" : "🥽 View in your room (AR)"}</span>
            </button>

            {/* Auto-Rotation Toggle */}
            <button
              onClick={() => setIsRotating(!isRotating)}
              style={{
                background: isRotating ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)",
                color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.15)",
                padding: "0.4rem 0.8rem", borderRadius: "2rem", fontSize: "0.8rem",
                cursor: "pointer"
              }}
            >
              {isRotating ? "⏸ Pause Rotation" : "▶ Auto Rotate"}
            </button>
          </div>

          {/* Screenshot Button */}
          <button
            onClick={handleSnapshot}
            title="Download high-res snapshot"
            style={{
              position: "absolute", top: "1rem", right: "1rem", zIndex: 10,
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff", width: "40px", height: "40px", borderRadius: "50%",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
            }}
          >
            📸
          </button>

          {/* Instructions Toast */}
          <div style={{
            position: "absolute", bottom: "1rem", left: "50%", transform: "translateX(-50%)", zIndex: 10,
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)",
            padding: "0.4rem 1rem", borderRadius: "2rem", color: "#94a3b8",
            fontSize: "0.75rem", pointerEvents: "none", border: "1px solid rgba(255,255,255,0.1)"
          }}>
            🖱️ Drag to rotate 360° · Pinch/Scroll to zoom · Right-click to pan
          </div>
        </div>

        {/* Bottom Customizer Bar */}
        <div style={{
          padding: "1rem 1.5rem", background: "rgba(10, 16, 29, 0.95)",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem"
        }}>
          {/* Pot Customizer */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "0.85rem", color: "#94a3b8", fontWeight: 600 }}>Pot Color:</span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {POT_COLORS.map((pot) => (
                <button
                  key={pot.id}
                  onClick={() => handlePotChange(pot.id)}
                  title={pot.name}
                  style={{
                    width: "28px", height: "28px", borderRadius: "50%",
                    background: pot.hex, cursor: "pointer",
                    border: activePot === pot.id ? "3px solid #52b788" : "1px solid rgba(255,255,255,0.2)",
                    boxShadow: activePot === pot.id ? "0 0 10px #52b788" : "none",
                    transition: "all 0.2s ease"
                  }}
                />
              ))}
            </div>
          </div>

          {/* Lighting Mode */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", color: "#94a3b8", fontWeight: 600 }}>Lighting:</span>
            <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: "0.5rem", padding: "0.2rem" }}>
              {LIGHT_PRESETS.map((light) => (
                <button
                  key={light.id}
                  onClick={() => handleLightChange(light.id)}
                  style={{
                    background: activeLight === light.id ? "#2d6a4f" : "transparent",
                    color: activeLight === light.id ? "#fff" : "#94a3b8",
                    border: "none", padding: "0.35rem 0.75rem", borderRadius: "0.35rem",
                    fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                    transition: "background 0.2s"
                  }}
                >
                  {light.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
