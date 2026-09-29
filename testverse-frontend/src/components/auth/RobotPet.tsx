import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './RobotPet.css';

// ─────────────────────────────────────────────────────────────────────────────
// RobotPet — WALL-E / Shimeji-style Three.js robot that clings to the top rim
// of the TestVerse login card. Ported faithfully from reference source code.
//
// Key behaviors (matching reference):
//  • posX ∈ [-1.85, 1.85] world units, mapped from cursor x over canvas rect
//  • posX += (targetPosX - posX) * 0.06  — smooth crawl interpolation
//  • walkCycle += 0.22 per frame when isMoving — alternating arm wobble 0.35
//  • body waddle: rotation.z = sin * 0.08, vertical hop: abs(sin) * 0.06
//  • headGroup.lookAt(currentLookAt), lerp 0.09 — smooth binocular tracking
//  • pupils clamped ±0.06 inside amber lenses
//  • isReaching: right arm extends toward cursor when proximity < 1.4
//  • isHidingPassword: robot ducks + head droops for privacy
//  • speech bubble: positioned from projected 3D head world position
//  • ResizeObserver keeps canvas synced to card width
// ─────────────────────────────────────────────────────────────────────────────

interface RobotPetProps {
  cardRef: React.RefObject<HTMLDivElement>;
}

// ── Speech bubble messages ─────────────────────────────────────────────────
const IDLE_MSGS = [
  'Watching 👀', 'Hi! 👋', 'TestVerse! 🤖', '...', 'Boop!', 'Hello!',
];
const PASS_MSG  = '🙈 PRIVACY MODE!';

// ── Procedural weathered texture (painted rust + scratches, no images) ──────
function makeWeatheredTex(): THREE.CanvasTexture {
  const c  = document.createElement('canvas');
  c.width  = 256;
  c.height = 256;
  const cx = c.getContext('2d')!;

  // Base amber
  cx.fillStyle = '#c59d53';
  cx.fillRect(0, 0, 256, 256);

  // Rust / grime speckles
  for (let i = 0; i < 340; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = Math.random() * 9 + 2;
    cx.fillStyle = Math.random() > 0.5
      ? 'rgba(74,45,18,0.3)' : 'rgba(45,45,45,0.25)';
    cx.beginPath();
    cx.arc(x, y, r, 0, Math.PI * 2);
    cx.fill();
  }
  // Metallic scratches
  cx.strokeStyle = 'rgba(235,235,235,0.32)';
  cx.lineWidth = 1;
  for (let i = 0; i < 20; i++) {
    const sx = Math.random() * 256;
    const sy = Math.random() * 256;
    cx.beginPath();
    cx.moveTo(sx, sy);
    cx.lineTo(sx + (Math.random() - 0.5) * 40, sy + (Math.random() - 0.5) * 40);
    cx.stroke();
  }
  return new THREE.CanvasTexture(c);
}

// ─────────────────────────────────────────────────────────────────────────────
// buildWalle — WALL-E procedural rig
//   Returns the root group plus all the parts that need to be animated.
// ─────────────────────────────────────────────────────────────────────────────
interface WalleParts {
  root:         THREE.Group;
  headGroup:    THREE.Group;
  leftEyeBox:   THREE.Group;
  rightEyeBox:  THREE.Group;
  leftPupil:    THREE.Mesh;
  rightPupil:   THREE.Mesh;
  leftBrow:     THREE.Mesh;
  rightBrow:    THREE.Mesh;
  leftArmGroup: THREE.Group;
  rightArmGroup:THREE.Group;
  leftForearm:  THREE.Group;
  rightForearm: THREE.Group;
  rightClawA:   THREE.Mesh;
  rightClawB:   THREE.Mesh;
  disposables:  Array<THREE.BufferGeometry | THREE.Material | THREE.CanvasTexture>;
}

function buildWalle(): WalleParts {
  const disposables: Array<THREE.BufferGeometry | THREE.Material | THREE.CanvasTexture> = [];

  function mesh(geo: THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh {
    disposables.push(geo, mat);
    return new THREE.Mesh(geo, mat);
  }

  const weatheredTex = makeWeatheredTex();
  disposables.push(weatheredTex);

  // ── Materials ──────────────────────────────────────────────────────────────
  const yellowBodyMat = new THREE.MeshStandardMaterial({
    map: weatheredTex, roughness: 0.5, metalness: 0.25,
  });
  disposables.push(yellowBodyMat);

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, roughness: 0.32, metalness: 0.82,
  });
  disposables.push(metalMat);

  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b, roughness: 0.55, metalness: 0.85,
  });
  disposables.push(darkSteelMat);

  const amberLensMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, emissive: new THREE.Color(0x78350f),
    roughness: 0.1, metalness: 0.1,
  });
  disposables.push(amberLensMat);

  const darkPupilMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0c, roughness: 0.05, metalness: 0.95,
  });
  disposables.push(darkPupilMat);

  // ── Root group ─────────────────────────────────────────────────────────────
  const root = new THREE.Group();

  // ── 1. Torso chassis ───────────────────────────────────────────────────────
  const torsoGeo = new THREE.BoxGeometry(1.3, 1.1, 1.1);
  const torso = mesh(torsoGeo, yellowBodyMat);
  torso.position.y = 0.55;
  root.add(torso);

  // Front panel gauge detail
  const panelGeo = new THREE.PlaneGeometry(0.65, 0.3);
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
  disposables.push(panelGeo, panelMat);
  const panel = new THREE.Mesh(panelGeo, panelMat);
  panel.position.set(0, 0.62, 0.56);
  root.add(panel);

  // ── 2. Hydraulic neck ──────────────────────────────────────────────────────
  const neckGroup = new THREE.Group();
  neckGroup.position.set(0, 1.1, -0.1);
  root.add(neckGroup);

  const neckBaseGeo = new THREE.BoxGeometry(0.32, 0.18, 0.32);
  neckGroup.add(mesh(neckBaseGeo, metalMat));

  const pistonGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.65, 16);
  const leftPiston = mesh(pistonGeo, metalMat);
  leftPiston.position.set(-0.08, 0.35, 0.04);
  neckGroup.add(leftPiston);

  const rightPiston = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.65, 16), metalMat);
  rightPiston.position.set(0.08, 0.35, 0.04);
  neckGroup.add(rightPiston);

  // ── 3. Binocular head assembly ──────────────────────────────────────────────
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.7, 0.08);
  neckGroup.add(headGroup);

  // Pivot shaft
  const shaftGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.9, 16);
  shaftGeo.rotateZ(Math.PI / 2);
  headGroup.add(mesh(shaftGeo, darkSteelMat));

  // Eye housing / bezel / lens geometries (reused per eye)
  function buildEye(side: -1 | 1): {
    eyeBox: THREE.Group; pupil: THREE.Mesh; brow: THREE.Mesh;
  } {
    const eyeBox = new THREE.Group();
    eyeBox.position.set(side * 0.44, 0.12, 0);
    eyeBox.rotation.z = side * -0.15; // signature droop
    headGroup.add(eyeBox);

    // Housing
    const housingGeo = new THREE.BoxGeometry(0.72, 0.58, 0.9);
    eyeBox.add(mesh(housingGeo, metalMat));

    // Bezel
    const bezelGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.08, 24);
    bezelGeo.rotateX(Math.PI / 2);
    const bezel = mesh(bezelGeo, darkSteelMat);
    bezel.position.set(0, 0, 0.46);
    eyeBox.add(bezel);

    // Lens (amber glow)
    const lensGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.04, 24);
    lensGeo.rotateX(Math.PI / 2);
    const lens = mesh(lensGeo, amberLensMat);
    lens.position.set(0, 0, 0.49);
    eyeBox.add(lens);

    // Pupil
    const pupilGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const pupil = mesh(pupilGeo, darkPupilMat);
    pupil.position.set(0, 0, 0.50);
    eyeBox.add(pupil);

    // Brow
    const browGeo = new THREE.BoxGeometry(0.7, 0.07, 0.35);
    const brow = mesh(browGeo, darkSteelMat);
    brow.position.set(0, 0.32, 0.2);
    eyeBox.add(brow);

    return { eyeBox, pupil, brow };
  }

  const leftEyeParts  = buildEye(-1);
  const rightEyeParts = buildEye(1);

  // ── 4. Articulated arms with claws ─────────────────────────────────────────
  function buildArm(side: -1 | 1): {
    armGroup: THREE.Group;
    forearm:  THREE.Group;
    clawA:    THREE.Mesh;
    clawB:    THREE.Mesh;
  } {
    const armGroup = new THREE.Group();
    armGroup.position.set(side * 0.7, 0.85, 0);
    root.add(armGroup);

    // Shoulder sphere
    const shoulderGeo = new THREE.SphereGeometry(0.12, 16, 16);
    armGroup.add(mesh(shoulderGeo, darkSteelMat));

    // Upper arm
    const upperGeo = new THREE.BoxGeometry(0.16, 0.65, 0.16);
    const upper = mesh(upperGeo, yellowBodyMat);
    upper.position.y = -0.3;
    armGroup.add(upper);

    // Forearm group (hinges at elbow)
    const forearm = new THREE.Group();
    forearm.position.y = -0.6;
    armGroup.add(forearm);

    const lowerGeo = new THREE.BoxGeometry(0.16, 0.65, 0.16);
    const lower = mesh(lowerGeo, metalMat);
    lower.position.y = -0.3;
    forearm.add(lower);

    // Claw fingers
    const clawGeo = new THREE.BoxGeometry(0.08, 0.35, 0.1);
    const clawA = mesh(new THREE.BoxGeometry(0.08, 0.35, 0.1), darkSteelMat);
    clawA.position.set(-0.08, -0.75, 0.08);
    forearm.add(clawA);
    disposables.push(clawGeo);

    const clawB = mesh(new THREE.BoxGeometry(0.08, 0.35, 0.1), darkSteelMat);
    clawB.position.set(0.08, -0.75, 0.08);
    forearm.add(clawB);

    return { armGroup, forearm, clawA, clawB };
  }

  const leftArm  = buildArm(-1);
  const rightArm = buildArm(1);

  return {
    root,
    headGroup,
    leftEyeBox:   leftEyeParts.eyeBox,
    rightEyeBox:  rightEyeParts.eyeBox,
    leftPupil:    leftEyeParts.pupil,
    rightPupil:   rightEyeParts.pupil,
    leftBrow:     leftEyeParts.brow,
    rightBrow:    rightEyeParts.brow,
    leftArmGroup: leftArm.armGroup,
    rightArmGroup:rightArm.armGroup,
    leftForearm:  leftArm.forearm,
    rightForearm: rightArm.forearm,
    rightClawA:   rightArm.clawA,
    rightClawB:   rightArm.clawB,
    disposables,
  };
}

// ── Default rim-grip stance (matching reference exactly) ─────────────────────
function setRimGripStance(w: WalleParts) {
  w.leftArmGroup.rotation.set(0.45, 0, 0.28);
  w.leftForearm.rotation.set(-1.15, 0, 0.15);
  w.rightArmGroup.rotation.set(0.45, 0, -0.28);
  w.rightForearm.rotation.set(-1.15, 0, -0.15);
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const RobotPet: React.FC<RobotPetProps> = ({ cardRef }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const bubbleRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas  = canvasRef.current;
    const bubble  = bubbleRef.current;
    if (!wrapper || !canvas) return;

    // ── Renderer / Scene / Camera ─────────────────────────────────────────────
    const W = wrapper.offsetWidth  || 480;
    const H = wrapper.offsetHeight || 125;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;

    const scene  = new THREE.Scene();

    // Camera matching reference: FOV 40, position (0, 0.1, 5.8)
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
    camera.position.set(0, 0.1, 5.8);

    // ── Lights (matching reference: ambient 1.4, cyan rim 2.5, warm key 2.3) ─
    const ambient = new THREE.AmbientLight(0xf1f5f9, 1.4);
    scene.add(ambient);

    const cyanRim = new THREE.DirectionalLight(0x00f0ff, 2.5);
    cyanRim.position.set(-3, 3, 3);
    scene.add(cyanRim);

    const warmKey = new THREE.DirectionalLight(0xffb74d, 2.3);
    warmKey.position.set(3, 3, 3);
    scene.add(warmKey);

    // ── Build WALL-E ──────────────────────────────────────────────────────────
    const w = buildWalle();
    w.root.scale.setScalar(0.34);             // same scale as reference

    // posY anchors claws exactly on the top glass rim (matching reference -0.32)
    const POS_Y = -0.32;
    w.root.position.set(-1.1, POS_Y, 0);     // start position matches reference
    scene.add(w.root);

    setRimGripStance(w);

    // ── Physics state ─────────────────────────────────────────────────────────
    // All state kept in plain object — never triggers re-renders
    let posX         = -1.1;
    let targetPosX   = -1.1;
    let walkCycle    = 0;
    let isReaching   = false;
    let reachProgress= 0;
    let isHiding     = false;

    // Mouse in normalised canvas space [-1..1]
    const mouse = { x: 0, y: 0 };

    // Head look-at vectors (from reference)
    const targetLookAt  = new THREE.Vector3(0, 0, 5);
    const currentLookAt = new THREE.Vector3(0, 0, 5);

    let rafId = 0;

    // ── Cursor tracking — relative to the canvas rect ─────────────────────────
    // (Exactly as in the reference: canvas.getBoundingClientRect)
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      // NDC [-1..1] relative to canvas
      mouse.x = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;

      // Update 3D look-at target (same formula as reference)
      targetLookAt.set(mouse.x * 4.2, mouse.y * 3.5, 4.0);

      if (isHiding) return;

      // Top-rim lateral position: cursor x maps to [-1.85, 1.85] (reference exact)
      targetPosX = Math.max(-1.85, Math.min(1.85, mouse.x * 2.3));

      // Proximity check: is cursor close to robot? (reference: distance < 1.4, mouse.y > -0.4)
      const dist = Math.sqrt(
        Math.pow(posX - mouse.x * 2.5, 2) +
        Math.pow(POS_Y - mouse.y * 1.5, 2)
      );
      isReaching = dist < 1.4 && mouse.y > -0.4;
    };
    document.addEventListener('mousemove', onMouseMove, { passive: true });

    // ── Password focus detection ───────────────────────────────────────────────
    const onFocusIn = (e: FocusEvent) => {
      if ((e.target as HTMLInputElement)?.type === 'password') {
        isHiding = true;
        showBubble(PASS_MSG, 2500);
      }
    };
    const onFocusOut = (e: FocusEvent) => {
      if ((e.target as HTMLInputElement)?.type === 'password') {
        isHiding = false;
        w.root.position.y = POS_Y;
      }
    };
    document.addEventListener('focusin',  onFocusIn);
    document.addEventListener('focusout', onFocusOut);

    // ── Speech bubble (positioned from projected 3D head, like reference) ──────
    let bubbleTimer: ReturnType<typeof setTimeout> | null = null;
    let bubbleVisible = false;

    function updateBubblePos() {
      if (!bubble || !w.headGroup) return;
      const pos = new THREE.Vector3();
      w.headGroup.getWorldPosition(pos);
      pos.y += 0.35;
      pos.project(camera);

      const rect  = canvas.getBoundingClientRect();
      // Convert to position relative to the WRAPPER (since bubble is inside it)
      const wRect = wrapper.getBoundingClientRect();
      const screenX = (pos.x * 0.5 + 0.5) * rect.width  + rect.left;
      const screenY = (-pos.y * 0.5 + 0.5) * rect.height + rect.top;
      // Relative to wrapper
      bubble.style.left = `${screenX - wRect.left}px`;
      bubble.style.top  = `${screenY - wRect.top}px`;
    }

    function showBubble(text: string, durationMs: number) {
      if (!bubble) return;
      if (bubbleTimer) clearTimeout(bubbleTimer);
      bubble.textContent = text;
      bubble.classList.add('visible');
      bubbleVisible = true;
      updateBubblePos();
      bubbleTimer = setTimeout(() => {
        bubble.classList.remove('visible');
        bubbleVisible = false;
      }, durationMs);
    }

    // Greeting after load
    setTimeout(() => showBubble('WALL-E online! 🤖', 2200), 1600);

    // Periodic idle messages
    const idleInterval = setInterval(() => {
      if (!bubbleVisible && !isHiding) {
        showBubble(IDLE_MSGS[Math.floor(Math.random() * IDLE_MSGS.length)], 2000);
      }
    }, 10000 + Math.random() * 8000);

    // ── ResizeObserver ────────────────────────────────────────────────────────
    let ro: ResizeObserver | null = null;
    const onResize = () => {
      const nW = wrapper.offsetWidth  || 480;
      const nH = wrapper.offsetHeight || 125;
      renderer.setSize(nW, nH);
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
    };
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(onResize);
      ro.observe(wrapper);
    } else {
      window.addEventListener('resize', onResize);
    }

    // ── Animation loop — matching reference logic exactly ─────────────────────
    function animate() {
      rafId = requestAnimationFrame(animate);

      // ── Smooth horizontal crawl (reference: dx * 0.06) ────────────────────
      const dx = targetPosX - posX;
      posX += dx * 0.06;
      w.root.position.x = posX;

      const isMoving = Math.abs(dx) > 0.02;

      // ── Clumsy walking locomotion ─────────────────────────────────────────
      if (isMoving && !isHiding) {
        walkCycle += 0.22;                            // reference: 0.22
        const armWobble = Math.sin(walkCycle) * 0.35; // reference: 0.35

        w.leftArmGroup.rotation.x  = 0.45 + armWobble;
        w.rightArmGroup.rotation.x = 0.45 - armWobble;

        // Body waddle + vertical hop (reference exact)
        w.root.rotation.z     = Math.sin(walkCycle) * 0.08;
        w.root.position.y     = POS_Y + Math.abs(Math.sin(walkCycle)) * 0.06;
      } else if (!isMoving && !isReaching && !isHiding) {
        // Return to neutral grip stance
        w.root.rotation.z *= 0.85;
        w.root.position.y  = POS_Y;
        setRimGripStance(w);
      }

      // ── Smooth 3D head + eye cursor tracking ─────────────────────────────
      currentLookAt.lerp(targetLookAt, 0.09);    // reference: 0.09

      if (!isHiding) {
        w.headGroup.lookAt(currentLookAt);

        // Pupils clamped ±0.06 (reference exact)
        const pupilX = THREE.MathUtils.clamp(mouse.x * 0.08, -0.06, 0.06);
        const pupilY = THREE.MathUtils.clamp(mouse.y * 0.08, -0.06, 0.06);
        w.leftPupil.position.set(pupilX, pupilY, 0.50);
        w.rightPupil.position.set(pupilX, pupilY, 0.50);

        // Eyebrow curiosity lift
        const browLift = Math.max(0, mouse.y * 0.04);
        w.leftBrow.position.y  = 0.32 + browLift;
        w.rightBrow.position.y = 0.32 + browLift;
      }

      // ── Cursor reach gesture ───────────────────────────────────────────────
      reachProgress = isReaching
        ? Math.min(1, reachProgress + 0.10)
        : Math.max(0, reachProgress - 0.10);

      if (reachProgress > 0.01) {
        // Right arm reaches out (reference exact lerp values)
        w.rightArmGroup.rotation.x = THREE.MathUtils.lerp(0.45, -1.2, reachProgress);
        w.rightArmGroup.rotation.y = THREE.MathUtils.lerp(0, (mouse.x - posX * 0.3) * 0.8, reachProgress);
        w.rightForearm.rotation.x  = THREE.MathUtils.lerp(-1.15, -0.15, reachProgress);

        // Open claws (reference: ±0.45)
        w.rightClawA.rotation.z =  reachProgress * 0.45;
        w.rightClawB.rotation.z = -reachProgress * 0.45;
      }

      // ── Password privacy duck ──────────────────────────────────────────────
      if (isHiding) {
        // Ducks lower behind card rim (reference: posY - 0.45 target)
        w.root.position.y += ((POS_Y - 0.45) - w.root.position.y) * 0.15;
        w.headGroup.rotation.x += (0.6 - w.headGroup.rotation.x) * 0.15;
        w.headGroup.rotation.y += (-0.8 - w.headGroup.rotation.y) * 0.15;
        w.leftBrow.position.y   = 0.25;
        w.rightBrow.position.y  = 0.25;
      }

      // Update speech bubble position to follow the 3D head
      updateBubblePos();

      renderer.render(scene, camera);
    }

    animate();

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(idleInterval);
      if (bubbleTimer) clearTimeout(bubbleTimer);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('focusin',  onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      ro?.disconnect();
      window.removeEventListener('resize', onResize);
      w.disposables.forEach((d) => d.dispose());
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
      <canvas ref={canvasRef} className="robot-pet-canvas" />
      {/* Speech bubble: positioned via JS (updateBubblePos) to follow 3D head */}
      <div ref={bubbleRef} className="robot-speech-bubble" />
    </div>
  );
};

export default RobotPet;
