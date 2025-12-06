import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Group } from "three";
import { Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Cake } from "./models/cake";
import { Candle } from "./models/candle";
import { Table } from "./models/table";
import { PictureFrame } from "./models/pictureFrame";
import { BirthdayCard } from "./components/BirthdayCard";
import { Fireworks } from "./components/Fireworks";

import "./App.css";

// -------------------
// Error Boundary
// -------------------
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div style={{ color: "white", padding: 20 }}>Something went wrong.</div>;
    }
    return this.props.children;
  }
}

// -------------------
// Constants
// -------------------
const ORBIT_TARGET = new Vector3(0, 1, 0);
const ORBIT_INITIAL_RADIUS = 3;
const ORBIT_INITIAL_HEIGHT = 1;
const ORBIT_INITIAL_AZIMUTH = Math.PI / 2;
const ORBIT_MIN_DISTANCE = 2;
const ORBIT_MAX_DISTANCE = 8;
const ORBIT_MIN_POLAR = 0;
const ORBIT_MAX_POLAR = Math.PI / 2;

const TYPED_LINES = [
  "> asma",
  "...",
  "> today is your birthday",
  "...",
  "> so i made you this, hope you like it",
  "...",
  "with love <3"
];
const TYPED_CHAR_DELAY = 100;
const POST_TYPING_SCENE_DELAY = 1000;
const CURSOR_BLINK_INTERVAL = 480;

type BirthdayCardConfig = {
  id: string;
  image: string;
  position: [number, number, number];
  rotation: [number, number, number];
};

const BIRTHDAY_CARDS: BirthdayCardConfig[] = [
  { id: "confetti", image: "/card.png", position: [1, 0.081, -2], rotation: [-Math.PI / 2, 0, Math.PI / 3] }
];

// -------------------
// OrbitControls wrapper
// -------------------
function ConfiguredOrbitControls() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    const offset = new Vector3(
      Math.sin(ORBIT_INITIAL_AZIMUTH) * ORBIT_INITIAL_RADIUS,
      ORBIT_INITIAL_HEIGHT,
      Math.cos(ORBIT_INITIAL_AZIMUTH) * ORBIT_INITIAL_RADIUS
    );
    camera.position.copy(ORBIT_TARGET.clone().add(offset));
    camera.lookAt(ORBIT_TARGET);

    if (controlsRef.current) {
      controlsRef.current.target.copy(ORBIT_TARGET);
      controlsRef.current.update();
    }
  }, [camera]);

  return <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.05} minDistance={ORBIT_MIN_DISTANCE} maxDistance={ORBIT_MAX_DISTANCE} minPolarAngle={ORBIT_MIN_POLAR} maxPolarAngle={ORBIT_MAX_POLAR} />;
}

// -------------------
// Main App
// -------------------
export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [sceneStarted, setSceneStarted] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [isCandleLit, setIsCandleLit] = useState(true);
  const [fireworksActive, setFireworksActive] = useState(false);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio("/music.mp3");
    audio.loop = true;
    audio.preload = "auto";
    backgroundAudioRef.current = audio;
    return () => { audio.pause(); backgroundAudioRef.current = null; };
  }, []);

  const playBackgroundMusic = useCallback(() => {
    const audio = backgroundAudioRef.current;
    if (!audio || !audio.paused) return;
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  }, []);

  const typingComplete = currentLineIndex >= TYPED_LINES.length;
  const typedLines = useMemo(() => {
    return TYPED_LINES.map((line, index) => {
      if (typingComplete || index < currentLineIndex) return line;
      if (index === currentLineIndex) return line.slice(0, Math.min(currentCharIndex, line.length));
      return "";
    });
  }, [currentCharIndex, currentLineIndex, typingComplete]);

  const cursorLineIndex = typingComplete ? Math.max(typedLines.length - 1, 0) : currentLineIndex;

  // Typing effect
  useEffect(() => {
    if (!hasStarted) return;
    if (typingComplete && !sceneStarted) {
      const handle = window.setTimeout(() => setSceneStarted(true), POST_TYPING_SCENE_DELAY);
      return () => window.clearTimeout(handle);
    }
    if (typingComplete) return;

    const line = TYPED_LINES[currentLineIndex] ?? "";
    const handle = window.setTimeout(() => {
      if (currentCharIndex < line.length) setCurrentCharIndex((prev) => prev + 1);
      else setCurrentLineIndex(currentLineIndex + 1), setCurrentCharIndex(0);
    }, TYPED_CHAR_DELAY);

    return () => window.clearTimeout(handle);
  }, [hasStarted, currentCharIndex, currentLineIndex, typingComplete, sceneStarted]);

  // Cursor blink
  useEffect(() => {
    const handle = window.setInterval(() => setCursorVisible((prev) => !prev), CURSOR_BLINK_INTERVAL);
    return () => window.clearInterval(handle);
  }, []);

  // Spacebar logic
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" && event.key !== " ") return;
      event.preventDefault();
      if (!hasStarted) { playBackgroundMusic(); setHasStarted(true); return; }
      if (sceneStarted && isCandleLit) { setIsCandleLit(false); setFireworksActive(true); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasStarted, sceneStarted, isCandleLit, playBackgroundMusic]);

  const handleCardToggle = useCallback((id: string) => setActiveCardId((current) => (current === id ? null : id)), []);

  const isScenePlaying = hasStarted && sceneStarted;

  return (
    <ErrorBoundary>
      <div className="App">
        <div className="background-overlay">
          <div className="typed-text">
            {typedLines.map((line, index) => {
              const showCursor = cursorVisible && index === cursorLineIndex && !typingComplete;
              return <span key={index} className="typed-line">{line || "\u00a0"}{showCursor && <span className="typed-cursor">_</span>}</span>;
            })}
          </div>
        </div>
        {sceneStarted && (
          <Canvas gl={{ alpha: true }} style={{ background: "transparent" }} onCreated={({ gl }) => gl.setClearColor("#000000", 0)}>
            <Suspense fallback={null}>
              <group>
                <Table />
                <Cake />
                <Candle isLit={isCandleLit} scale={0.25} position={[0, 1.1, 0]} />
                <PictureFrame image="/frame1.jpg" position={[0, 0.735, 0]} rotation={[0, 0, 0]} scale={0.75} />
                {BIRTHDAY_CARDS.map((card) => (
                  <BirthdayCard
                    key={card.id}
                    id={card.id}
                    image={card.image}
                    tablePosition={card.position}
                    tableRotation={card.rotation}
                    isActive={activeCardId === card.id}
                    onToggle={handleCardToggle}
                  />
                ))}
                <Fireworks isActive={fireworksActive} origin={[0, 10, 0]} />
              </group>
              <ambientLight intensity={1} />
              <directionalLight intensity={0.8} position={[2, 10, 0]} color={[1, 0.95, 0.9]} />
              <spotLight intensity={0.5} position={[0, 5, 5]} angle={Math.PI / 6} penumbra={0.3} />
              <Environment files={["/shanghai_bund_4k.hdr"]} background />
              <ConfiguredOrbitControls />
            </Suspense>
          </Canvas>
        )}
      </div>
    </ErrorBoundary>
  );
}
