import { useTexture } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import { useEffect } from "react";
import { SRGBColorSpace } from "three";

type SimplePictureFrameProps = ThreeElements["group"] & {
  image: string;
  frameWidth?: number;
  frameHeight?: number;
};

export function SimplePictureFrame({
  image,
  frameWidth = 1,
  frameHeight = 0.75,
  children,
  ...groupProps
}: SimplePictureFrameProps) {
  const texture = useTexture(image);

  useEffect(() => {
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 4;
  }, [texture]);

  const frameThickness = 0.05;
  const frameDepth = 0.02;

  return (
    <group {...groupProps}>
      {/* Picture */}
      <mesh position={[0, 0, frameDepth / 2]}>
        <planeGeometry args={[frameWidth, frameHeight]} />
        <meshStandardMaterial 
          map={texture} 
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* Frame Border - Top */}
      <mesh position={[0, frameHeight / 2 + frameThickness / 2, frameDepth / 2]}>
        <boxGeometry args={[frameWidth + frameThickness * 2, frameThickness, frameDepth]} />
        <meshStandardMaterial color="#8b7355" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Frame Border - Bottom */}
      <mesh position={[0, -frameHeight / 2 - frameThickness / 2, frameDepth / 2]}>
        <boxGeometry args={[frameWidth + frameThickness * 2, frameThickness, frameDepth]} />
        <meshStandardMaterial color="#8b7355" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Frame Border - Left */}
      <mesh position={[-frameWidth / 2 - frameThickness / 2, 0, frameDepth / 2]}>
        <boxGeometry args={[frameThickness, frameHeight, frameDepth]} />
        <meshStandardMaterial color="#8b7355" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Frame Border - Right */}
      <mesh position={[frameWidth / 2 + frameThickness / 2, 0, frameDepth / 2]}>
        <boxGeometry args={[frameThickness, frameHeight, frameDepth]} />
        <meshStandardMaterial color="#8b7355" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Back panel */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[frameWidth + frameThickness * 2, frameHeight + frameThickness * 2]} />
        <meshStandardMaterial color="#654321" roughness={0.9} />
      </mesh>

      {children}
    </group>
  );
}
