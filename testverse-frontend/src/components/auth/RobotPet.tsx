import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import './RobotPet.css';

// ─────────────────────────────────────────────────────────────────────────────
// RobotPet — Procedural Three.js robot companion on the TestVerse login card.
//
// Architecture:
//  • Transparent WebGLRenderer canvas absolutely positioned above the card.
//  • Robot built entirely from Three.js primitives (no external models/images).
//  • Cursor tracked via document mousemove (pointer-events:none on canvas).
//  • Password-field focus detected via document focusin/focusout bubbling.
//  • All resources disposed on unmount — zero memory leaks.
// ─────────────────────────────────────────────────────────────────────────────

interface RobotPetProps {
  cardRef: React.RefObject<HTMLDivElement>;
}

// ── Speech bubble messages ────────────────────────────────────────────────────
const IDLE_MESSAGES = ['Hi! 👋', 'Hello!', 'Watching 👀', 'TestVerse!', '...', 'Boop!'];
const PASSWORD_MESSAGE = 'Privacy mode 🤫';

// ── Material helpers ──────────────────────────────────────────────────────────
function mat(color: number, options: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.75, ...options });
}

// ── Build robot group ─────────────────────────────────────────────────────────
function buildRobot(): {
  group: THREE.Group;
  parts: {
    body: THREE.Mesh;
    head: THREE.Group;
    headPivot: THREE.Group;
    leftEyePupil: THREE.Mesh;
    rightEyePupil: THREE.Mesh;
    leftArm: THREE.Group;
    rightArm: THREE.Group;
    leftForearm: THREE.Group;
    rightForearm: THREE.Group;
    leftUpperArm: THREE.Mesh;
    rightUpperArm: THREE.Mesh;
    leftLowerArm: THREE.Mesh;
    rightLowerArm: THREE.Mesh;
    leftClaw: THREE.Group;
    rightClaw: THREE.Group;
    eyeLens: { left: THREE.Mesh; right: THREE.Mesh };
    frontPlate: THREE.Mesh;
    track: { left: THREE.Mesh; right: THREE.Mesh };
  };
  disposables: Array<THREE.BufferGeometry | THREE.Material>;
} {
  const group = new THREE.Group();
  const disposables: Array<THREE.BufferGeometry | THREE.Material> = [];

  function mesh(geo: THREE.BufferGeometry, material: THREE.Material): THREE.Mesh {
    disposables.push(geo, material);
    return new THREE.Mesh(geo, material);
  }

  // ── Colors ──────────────────────────────────────────────────────────────
  const BODY_COLOR    = 0xd4820a; // warm amber/golden
  const DARK_METAL    = 0x1a1a2e; // very dark navy
  const MID_METAL     = 0x2d3561; // dark steel blue
  const LIGHT_METAL   = 0x4a5580;
  const EYE_GLOW      = 0x38bdf8; // cyan — matches TestVerse accent
  const PUPIL_COLOR   = 0x0a1628;
  const ACCENT_RED    = 0xe63946;
  const TRACK_COLOR   = 0x151520;

  // ── Body chassis ─────────────────────────────────────────────────────────
  const bodyGeo = new THREE.BoxGeometry(1.0, 0.85, 0.7);
  const bodyMat = mat(BODY_COLOR, { roughness: 0.5, metalness: 0.7 });
  const body = mesh(bodyGeo, bodyMat);
  body.position.y = 0;
  body.castShadow = true;
  group.add(body);

  // Front plate
  const plateGeo = new THREE.BoxGeometry(0.72, 0.6, 0.08);
  const plateMat = mat(DARK_METAL, { roughness: 0.3, metalness: 0.9 });
  const frontPlate = mesh(plateGeo, plateMat);
  frontPlate.position.set(0, 0, 0.37);
  body.add(frontPlate);

  // Small accent indicator (red dot)
  const dotGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const dotMat = mat(ACCENT_RED, { emissive: new THREE.Color(ACCENT_RED), emissiveIntensity: 0.8 });
  const dot = mesh(dotGeo, dotMat);
  dot.position.set(-0.15, 0.05, 0.42);
  body.add(dot);

  // Yellow warning stripe bar on front
  const stripeGeo = new THREE.BoxGeometry(0.5, 0.1, 0.05);
  const stripeMat = mat(0xf5c518, { roughness: 0.6, metalness: 0.3 });
  const stripe1 = mesh(stripeGeo, stripeMat);
  stripe1.position.set(0, -0.15, 0.42);
  body.add(stripe1);

  // Green indicator strip
  const greenGeo = new THREE.BoxGeometry(0.28, 0.07, 0.05);
  const greenMat = mat(0x00e676, { emissive: new THREE.Color(0x00e676), emissiveIntensity: 0.5 });
  const greenStrip = mesh(greenGeo, greenMat);
  greenStrip.position.set(0.1, 0.1, 0.42);
  body.add(greenStrip);

  // Shoulder ridges
  [-0.55, 0.55].forEach((x) => {
    const ridgeGeo = new THREE.BoxGeometry(0.12, 0.55, 0.6);
    const ridgeMat = mat(MID_METAL, { roughness: 0.4, metalness: 0.85 });
    const ridge = mesh(ridgeGeo, ridgeMat);
    ridge.position.set(x, 0.12, 0);
    group.add(ridge);
  });

  // ── Tank tracks ──────────────────────────────────────────────────────────
  const trackGeo = new THREE.BoxGeometry(0.18, 0.38, 0.72);
  const trackMat = mat(TRACK_COLOR, { roughness: 0.8, metalness: 0.4 });
  const leftTrack = mesh(new THREE.BoxGeometry(0.18, 0.38, 0.72), trackMat.clone());
  const rightTrack = mesh(new THREE.BoxGeometry(0.18, 0.38, 0.72), trackMat.clone());
  disposables.push(trackGeo);
  leftTrack.position.set(-0.62, -0.32, 0);
  rightTrack.position.set(0.62, -0.32, 0);
  group.add(leftTrack, rightTrack);

  // Track wheels (small cylinders on sides)
  [[-0.62, 0.62]].flat().forEach((x) => {
    [-0.28, 0, 0.28].forEach((z) => {
      const wGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.1, 10);
      const wMat = mat(LIGHT_METAL, { roughness: 0.3, metalness: 0.9 });
      const w = mesh(wGeo, wMat);
      w.rotation.x = Math.PI / 2;
      w.position.set(x, -0.32, z);
      group.add(w);
    });
  });

  // ── Neck ─────────────────────────────────────────────────────────────────
  const neckGeo = new THREE.CylinderGeometry(0.1, 0.14, 0.28, 10);
  const neckMat = mat(DARK_METAL, { roughness: 0.3, metalness: 0.9 });
  const neck = mesh(neckGeo, neckMat);
  neck.position.y = 0.56;
  group.add(neck);

  // ── Head group ───────────────────────────────────────────────────────────
  const headPivot = new THREE.Group();
  headPivot.position.y = 0.7;
  group.add(headPivot);

  const head = new THREE.Group();
  headPivot.add(head);

  // Head housing
  const headGeo = new THREE.BoxGeometry(0.85, 0.52, 0.55);
  const headMat = mat(BODY_COLOR, { roughness: 0.45, metalness: 0.7 });
  const headMesh = mesh(headGeo, headMat);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Head top ridge
  const topRidgeGeo = new THREE.BoxGeometry(0.6, 0.08, 0.4);
  const topRidge = mesh(topRidgeGeo, mat(MID_METAL));
  topRidge.position.y = 0.3;
  head.add(topRidge);

  // Small antenna
  const antGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.22, 6);
  const ant = mesh(antGeo, mat(LIGHT_METAL));
  ant.position.set(0.18, 0.42, 0);
  head.add(ant);
  const antBallGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const antBall = mesh(antBallGeo, mat(EYE_GLOW, { emissive: new THREE.Color(EYE_GLOW), emissiveIntensity: 1.0 }));
  antBall.position.set(0.18, 0.55, 0);
  head.add(antBall);

  // ── Binocular eye housings ────────────────────────────────────────────────
  const eyeHousingGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.22, 14);
  const eyeHousingMat = mat(DARK_METAL, { roughness: 0.3, metalness: 0.9 });

  // Left eye housing
  const leftEyeHousing = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.22, 14), eyeHousingMat.clone());
  leftEyeHousing.rotation.x = Math.PI / 2;
  leftEyeHousing.position.set(-0.26, 0.04, 0.28);
  head.add(leftEyeHousing);

  // Right eye housing
  const rightEyeHousing = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.22, 14), eyeHousingMat.clone());
  rightEyeHousing.rotation.x = Math.PI / 2;
  rightEyeHousing.position.set(0.26, 0.04, 0.28);
  head.add(rightEyeHousing);
  disposables.push(eyeHousingGeo);

  // Lens glow ring (rim)
  const rimGeo = new THREE.TorusGeometry(0.15, 0.025, 8, 20);
  const rimMat = mat(EYE_GLOW, { emissive: new THREE.Color(EYE_GLOW), emissiveIntensity: 0.5 });
  const leftRim = mesh(new THREE.TorusGeometry(0.15, 0.025, 8, 20), rimMat.clone());
  leftRim.position.set(-0.26, 0.04, 0.4);
  head.add(leftRim);
  const rightRim = mesh(new THREE.TorusGeometry(0.15, 0.025, 8, 20), rimMat.clone());
  rightRim.position.set(0.26, 0.04, 0.4);
  head.add(rightRim);
  disposables.push(rimGeo);

  // Eye lenses (glowing cyan)
  const lensGeo = new THREE.CircleGeometry(0.13, 16);
  const lensMat = mat(EYE_GLOW, { emissive: new THREE.Color(EYE_GLOW), emissiveIntensity: 0.9, roughness: 0.0, metalness: 0.1 });
  const leftLens = mesh(new THREE.CircleGeometry(0.13, 16), lensMat.clone());
  leftLens.position.set(-0.26, 0.04, 0.41);
  head.add(leftLens);
  const rightLens = mesh(new THREE.CircleGeometry(0.13, 16), lensMat.clone());
  rightLens.position.set(0.26, 0.04, 0.41);
  head.add(rightLens);
  disposables.push(lensGeo);

  // Pupils (dark, will track cursor)
  const pupilGeo = new THREE.CircleGeometry(0.055, 12);
  const pupilMat = mat(PUPIL_COLOR, { roughness: 0.0, metalness: 0.0 });
  const leftPupil = mesh(new THREE.CircleGeometry(0.055, 12), pupilMat.clone());
  leftPupil.position.set(-0.26, 0.04, 0.415);
  head.add(leftPupil);
  const rightPupil = mesh(new THREE.CircleGeometry(0.055, 12), pupilMat.clone());
  rightPupil.position.set(0.26, 0.04, 0.415);
  head.add(rightPupil);
  disposables.push(pupilGeo);

  // ── Arms ─────────────────────────────────────────────────────────────────
  function buildArm(side: -1 | 1): {
    armGroup: THREE.Group;
    forearmGroup: THREE.Group;
    clawGroup: THREE.Group;
    upperMesh: THREE.Mesh;
    lowerMesh: THREE.Mesh;
  } {
    const armGroup = new THREE.Group();
    armGroup.position.set(side * 0.68, 0.2, 0);
    group.add(armGroup);

    // Shoulder socket
    const socketGeo = new THREE.SphereGeometry(0.1, 10, 10);
    const socketMat = mat(DARK_METAL);
    const socket = mesh(socketGeo, socketMat);
    armGroup.add(socket);

    // Upper arm
    const upperGeo = new THREE.BoxGeometry(0.14, 0.42, 0.14);
    const upperMat = mat(BODY_COLOR, { roughness: 0.5, metalness: 0.7 });
    const upper = mesh(upperGeo, upperMat);
    upper.position.y = -0.22;
    armGroup.add(upper);

    // Elbow
    const elbowGeo = new THREE.SphereGeometry(0.085, 8, 8);
    const elbow = mesh(elbowGeo, mat(DARK_METAL));
    elbow.position.y = -0.46;
    armGroup.add(elbow);

    // Forearm group (pivots at elbow)
    const forearmGroup = new THREE.Group();
    forearmGroup.position.y = -0.46;
    armGroup.add(forearmGroup);

    // Forearm
    const lowerGeo = new THREE.BoxGeometry(0.11, 0.36, 0.11);
    const lowerMat = mat(MID_METAL, { roughness: 0.4, metalness: 0.85 });
    const lower = mesh(lowerGeo, lowerMat);
    lower.position.y = -0.2;
    forearmGroup.add(lower);

    // Wrist
    const wristGeo = new THREE.SphereGeometry(0.072, 8, 8);
    const wrist = mesh(wristGeo, mat(DARK_METAL));
    wrist.position.y = -0.4;
    forearmGroup.add(wrist);

    // Claw group
    const clawGroup = new THREE.Group();
    clawGroup.position.y = -0.44;
    forearmGroup.add(clawGroup);

    // Three claw fingers
    [-0.07, 0, 0.07].forEach((offset, i) => {
      const clawGeo = new THREE.BoxGeometry(0.045, 0.14, 0.045);
      const clawMat = mat(DARK_METAL, { roughness: 0.2, metalness: 0.95 });
      const claw = mesh(clawGeo, clawMat);
      claw.position.set(offset, -0.08, 0);
      claw.rotation.z = (i - 1) * 0.18 * side;
      clawGroup.add(claw);
    });

    return { armGroup, forearmGroup, clawGroup, upperMesh: upper, lowerMesh: lower };
  }

  const leftArmParts  = buildArm(-1);
  const rightArmParts = buildArm(1);

  return {
    group,
    parts: {
      body,
      head,
      headPivot,
      leftEyePupil: leftPupil,
      rightEyePupil: rightPupil,
      leftArm: leftArmParts.armGroup,
      rightArm: rightArmParts.armGroup,
      leftForearm: leftArmParts.forearmGroup,
      rightForearm: rightArmParts.forearmGroup,
      leftUpperArm: leftArmParts.upperMesh,
      rightUpperArm: rightArmParts.upperMesh,
      leftLowerArm: leftArmParts.lowerMesh,
      rightLowerArm: rightArmParts.lowerMesh,
      leftClaw: leftArmParts.clawGroup,
      rightClaw: rightArmParts.clawGroup,
      eyeLens: { left: leftLens, right: rightLens },
      frontPlate,
      track: { left: leftTrack, right: rightTrack },
    },
    disposables,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
const RobotPet: React.FC<RobotPetProps> = ({ cardRef }) => {
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const bubbleRef    = useRef<HTMLDivElement>(null);

  // We store all animation state in a ref-object so RAF callbacks always
  // see the latest values without causing re-renders.
  const stateRef = useRef({
    // cursor position in normalised card space [-1..1]
    cursorNX: 0,
    cursorNY: 0,
    // robot horizontal position in world units along card top edge
    robotX: 0,
    targetX: 0,
    // smooth head tilt
    headRotY: 0,
    headRotX: 0,
    // pupil offset
    pupilLX: 0,
    pupilLY: 0,
    pupilRX: 0,
    pupilRY: 0,
    // arm swing
    leftArmAngle: 0,
    rightArmAngle: 0,
    // body bob
    bodyBob: 0,
    // time
    t: 0,
    // duck (password mode)
    duckTarget: 0,
    duckCurrent: 0,
    // horizontal movement
    walkDir: 1,
    walkTimer: 0,
    isWalking: false,
    cardWidth: 440,
    rafId: 0,
    // speech bubble
    bubbleTimer: 0,
    bubbleVisible: false,
    bubbleText: '',
  });

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas  = canvasRef.current;
    const bubble  = bubbleRef.current;
    if (!wrapper || !canvas) return;

    const s = stateRef.current;

    // ── Three.js setup ───────────────────────────────────────────────────────
    const W = wrapper.offsetWidth  || 450;
    const H = wrapper.offsetHeight || 140;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = false; // keep lightweight

    const scene = new THREE.Scene();

    // Orthographic-style perspective for the small robot
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
    camera.position.set(0, 1.0, 7.5);
    camera.lookAt(0, 0.3, 0);

    // ── Lights ───────────────────────────────────────────────────────────────
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(3, 6, 5);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x38bdf8, 0.6);
    fill.position.set(-3, 2, 4);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xd4820a, 0.4);
    rim.position.set(0, -2, -4);
    scene.add(rim);

    // ── Build robot ──────────────────────────────────────────────────────────
    const { group: robotGroup, parts, disposables } = buildRobot();
    // Scale down — the scene is small
    robotGroup.scale.setScalar(0.52);
    scene.add(robotGroup);

    // Store initial pupil local positions for offset calculations
    const leftPupilBase  = parts.leftEyePupil.position.clone();
    const rightPupilBase = parts.rightEyePupil.position.clone();

    // ── Cursor tracking (document-level, canvas has pointer-events:none) ─────
    const onMouseMove = (e: MouseEvent) => {
      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      // Map cursor to [-1..1] relative to card
      s.cursorNX = ((e.clientX - rect.left)  / rect.width  - 0.5) * 2;
      s.cursorNY = ((e.clientY - rect.top)   / rect.height - 0.5) * 2;
    };
    document.addEventListener('mousemove', onMouseMove, { passive: true });

    // ── Password focus detection ─────────────────────────────────────────────
    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target as HTMLInputElement).type === 'password') {
        s.duckTarget = 1;
        showBubble(PASSWORD_MESSAGE, 3500);
      }
    };
    const onFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target as HTMLInputElement).type === 'password') {
        s.duckTarget = 0;
      }
    };
    document.addEventListener('focusin',  onFocusIn);
    document.addEventListener('focusout', onFocusOut);

    // ── Speech bubble helper ─────────────────────────────────────────────────
    let bubbleTimeoutId: ReturnType<typeof setTimeout> | null = null;
    function showBubble(text: string, durationMs: number) {
      if (!bubble) return;
      if (bubbleTimeoutId) clearTimeout(bubbleTimeoutId);
      bubble.textContent = text;
      bubble.classList.add('visible');
      s.bubbleVisible = true;
      bubbleTimeoutId = setTimeout(() => {
        bubble.classList.remove('visible');
        s.bubbleVisible = false;
      }, durationMs);
    }

    // Show greeting after robot loads
    setTimeout(() => showBubble(IDLE_MESSAGES[0], 2500), 2000);

    // Periodic idle speech
    const idleSpeechInterval = setInterval(() => {
      if (!s.bubbleVisible && s.duckTarget === 0) {
        const msg = IDLE_MESSAGES[Math.floor(Math.random() * IDLE_MESSAGES.length)];
        showBubble(msg, 2000);
      }
    }, 8000 + Math.random() * 6000);

    // ── ResizeObserver — keep canvas size synced to card ────────────────────
    let ro: ResizeObserver | null = null;
    const onResize = () => {
      if (!wrapper) return;
      const nW = wrapper.offsetWidth  || 450;
      const nH = wrapper.offsetHeight || 140;
      renderer.setSize(nW, nH);
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
      s.cardWidth = cardRef.current?.offsetWidth ?? 440;
    };
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(onResize);
      ro.observe(wrapper);
    } else {
      window.addEventListener('resize', onResize);
    }
    s.cardWidth = cardRef.current?.offsetWidth ?? 440;

    // ── Animation loop ───────────────────────────────────────────────────────
    // Robot world units: card half-width maps to ~3.2 world units (empirical)
    const WORLD_HALF = 3.0;
    const WALK_SPEED = 0.018;
    const SMOOTH     = 0.04;

    // Randomise walk direction changes
    let walkChangeTimer = 3 + Math.random() * 4;

    const animate = () => {
      s.rafId = requestAnimationFrame(animate);
      s.t += 0.016;

      // ── Walk direction randomisation ──────────────────────────────────────
      walkChangeTimer -= 0.016;
      if (walkChangeTimer <= 0) {
        walkChangeTimer = 2.5 + Math.random() * 5;
        // Randomly: keep walking, stop, or flip direction
        const r = Math.random();
        if (r < 0.25) {
          s.isWalking = false;
        } else if (r < 0.55) {
          s.isWalking = true;
          s.walkDir *= -1;
        } else {
          s.isWalking = true;
        }
      }

      // ── Cursor-based target X (maps card cursor to world) ─────────────────
      const cursorTargetX = s.cursorNX * WORLD_HALF * 0.7;
      // Blend cursor target with walk-based target
      if (s.isWalking) {
        s.targetX += s.walkDir * WALK_SPEED;
      }
      // Pull slightly toward cursor even while walking
      s.targetX += (cursorTargetX - s.targetX) * 0.005;

      // Clamp to card edges
      s.targetX = Math.max(-WORLD_HALF + 0.3, Math.min(WORLD_HALF - 0.3, s.targetX));

      // Auto-bounce at edges
      if (s.targetX >= WORLD_HALF - 0.35) { s.walkDir = -1; }
      if (s.targetX <= -WORLD_HALF + 0.35) { s.walkDir = 1; }

      // Smooth robot position
      s.robotX += (s.targetX - s.robotX) * 0.06;
      robotGroup.position.x = s.robotX;

      // ── Duck (password privacy) ───────────────────────────────────────────
      s.duckCurrent += (s.duckTarget - s.duckCurrent) * 0.07;
      robotGroup.position.y = -s.duckCurrent * 1.8;

      // ── Body bob & wobble ─────────────────────────────────────────────────
      const walkSpeed = Math.abs(s.targetX - s.robotX);
      const bobFreq   = s.isWalking ? 8 : 2.5;
      const bobAmp    = s.isWalking ? 0.045 : 0.015;
      parts.body.position.y = Math.sin(s.t * bobFreq) * bobAmp;
      parts.body.rotation.z = Math.sin(s.t * bobFreq * 0.5) * (s.isWalking ? 0.03 : 0.01);

      // Face direction of movement
      const targetBodyRotY = s.walkDir < 0 ? 0.25 : -0.25;
      robotGroup.rotation.y += (targetBodyRotY - robotGroup.rotation.y) * 0.04;

      // ── Head tracking cursor ──────────────────────────────────────────────
      const headTargetY = s.cursorNX * 0.35;
      const headTargetX = s.cursorNY * 0.2;
      s.headRotY += (headTargetY - s.headRotY) * 0.06;
      s.headRotX += (headTargetX - s.headRotX) * 0.06;
      parts.headPivot.rotation.y = s.headRotY;
      parts.headPivot.rotation.x = s.headRotX + Math.sin(s.t * 1.8) * 0.012;

      // ── Pupil tracking ────────────────────────────────────────────────────
      const maxPupilOffset = 0.04;
      const targetPupilX = s.cursorNX * maxPupilOffset;
      const targetPupilY = -s.cursorNY * maxPupilOffset * 0.6;
      s.pupilLX += (targetPupilX - s.pupilLX) * 0.1;
      s.pupilLY += (targetPupilY - s.pupilLY) * 0.1;
      s.pupilRX += (targetPupilX - s.pupilRX) * 0.1;
      s.pupilRY += (targetPupilY - s.pupilRY) * 0.1;
      parts.leftEyePupil.position.x  = leftPupilBase.x  + s.pupilLX;
      parts.leftEyePupil.position.y  = leftPupilBase.y  + s.pupilLY;
      parts.rightEyePupil.position.x = rightPupilBase.x + s.pupilRX;
      parts.rightEyePupil.position.y = rightPupilBase.y + s.pupilRY;

      // ── Arm animation ─────────────────────────────────────────────────────
      const armSwing = s.isWalking
        ? Math.sin(s.t * 8) * 0.3
        : Math.sin(s.t * 1.5) * 0.08;
      parts.leftArm.rotation.x  =  armSwing + 0.1;
      parts.rightArm.rotation.x = -armSwing + 0.1;
      // Forearm slight bend
      const forearmBend = 0.35 + Math.sin(s.t * 1.8) * 0.1;
      parts.leftForearm.rotation.x  = forearmBend;
      parts.rightForearm.rotation.x = forearmBend;
      // Claw open/close
      const clawAngle = Math.sin(s.t * 1.2) * 0.15;
      parts.leftClaw.rotation.x  = clawAngle;
      parts.rightClaw.rotation.x = -clawAngle;

      // ── Render ────────────────────────────────────────────────────────────
      renderer.render(scene, camera);
    };

    animate();

    // ── Cleanup on unmount ───────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(s.rafId);
      clearInterval(idleSpeechInterval);
      if (bubbleTimeoutId) clearTimeout(bubbleTimeoutId);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('focusin',   onFocusIn);
      document.removeEventListener('focusout',  onFocusOut);
      ro?.disconnect();
      window.removeEventListener('resize', onResize);

      // Dispose Three.js resources
      disposables.forEach((d) => d.dispose());
      [ambient, key, fill, rim].forEach((l) => { scene.remove(l); });
      renderer.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="robot-pet-wrapper"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="robot-pet-canvas"
      />
      <div ref={bubbleRef} className="robot-speech-bubble" />
    </div>
  );
};

export default RobotPet;
