"use client";
import { useEffect, useRef, useState } from "react";

// Rigged CC0 robot (24-bone humanoid skeleton); posed procedurally below
const MODEL_URL = "/models/nb-robot.glb";
const POSTER_URL = "/models/nb-robot-poster.webp";
const MODEL_HEIGHT = 1.5; // metres, after normalising the file's units

// Human-like blinks: each one gets its own length and depth, closes faster than it opens, and the
// gaps vary from quick double blinks to long stares
const nextBlinkPlan = (t) => {
  const r = Math.random();
  const gap = r < 0.2 ? 0.15 + Math.random() * 0.15 : r < 0.85 ? 2 + Math.random() * 3.5 : 6 + Math.random() * 3;
  return {
    at: t + gap,
    length: 0.12 + Math.random() * 0.12,
    depth: Math.random() < 0.15 ? 0.45 + Math.random() * 0.2 : 1,
  };
};
// Scan line sweeps from the antenna to the waist (world metres) every SCAN_EVERY seconds
const SCAN_FROM = 1.55;
const SCAN_TO = 0.3;
const SCAN_TIME = 1.4;
const SCAN_EVERY = 7;
// Antenna stem as fractions of the robot's height: base and tip below the top, stem radius incl. the ball
const ANT_BASE = 0.093;
const ANT_TIP = 0.007;
const ANT_RADIUS = 0.016;

const smooth = (x) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};
// 0 → 1 → 0 envelope over `dur` seconds, easing in over `fadeIn` and out over `fadeOut`
const envelope = (u, dur, fadeIn, fadeOut) => smooth(u / fadeIn) * smooth((dur - u) / fadeOut);

// Idle actions, picked at random between short pauses (never the same one twice in a row).
// `pose(u)` gets seconds since the action started and returns any of:
//   face 0–1 (turn the head to the viewer), yaw (+ = towards the headline), pitch (+ = up), roll (head tilt),
//   right/left arm { raise (out to the side), forward, elbow, hand }, hop (metres), squint 0–1 (happy eyes),
//   rightLeg/leftLeg { lift (thigh forward), knee }, dip (metres down), bodyX (metres sideways),
//   spineRoll (lean), spin (radians about the vertical)
const BEAT = 0.5; // dances move to 120 bpm

// Robot dance keyframes: sharp poses, snapped between on every beat
const ROBOT_MOVES = [
  { yaw: 0.35, right: { raise: 1.45, elbow: 1.57 }, left: { raise: 0.15 } },
  { yaw: -0.35, right: { raise: 0.15 }, left: { raise: 1.45, elbow: 1.57 } },
  { pitch: 0.1, right: { raise: 1.45, elbow: -1.4 }, left: { raise: 1.45, elbow: -1.4 } },
  { right: { raise: 1.45, elbow: 1.57 }, left: { raise: 1.45, elbow: 1.57 } },
  { yaw: 0.25, roll: 0.15, right: { raise: 0.6, forward: 1.2, elbow: 0.9 }, left: { raise: 0.15 } },
  { yaw: -0.25, roll: -0.15, right: { raise: 0.15 }, left: { raise: 0.6, forward: 1.2, elbow: 0.9 } },
];
const lerp = (a = 0, b = 0, k) => a + (b - a) * k;
const lerpArm = (a = {}, b = {}, k) => ({
  raise: lerp(a.raise, b.raise, k),
  forward: lerp(a.forward, b.forward, k),
  elbow: lerp(a.elbow, b.elbow, k),
  hand: lerp(a.hand, b.hand, k),
});

const ACTIONS = {
  wave: {
    dur: 4.6,
    weight: 3,
    pose: (u) => {
      const lift = envelope(u, 4.5, 0.9, 1);
      const waving = envelope(u - 0.9, 2.6, 0.3, 0.3) * Math.sin((u - 0.9) * Math.PI * 3);
      const face = envelope(u, 4.6, 0.5, 0.6);
      return {
        face,
        roll: 0.12 * face,
        right: { raise: 1.08 * lift, forward: 0.25 * lift, elbow: 1.7 * lift + 0.32 * waving, hand: 0.25 * waving },
      };
    },
  },
  point: {
    dur: 3.4,
    weight: 2,
    pose: (u) => {
      const e = envelope(u, 3.4, 0.6, 0.7);
      const bob = Math.sin(u * Math.PI * 2.4) * 0.05 * e;
      return { yaw: 0.45 * e, pitch: 0.05 * e, right: { raise: 1.35 * e + bob, forward: 0.45 * e, elbow: 0.15 * e } };
    },
  },
  celebrate: {
    dur: 2.8,
    weight: 2,
    pose: (u) => {
      const e = envelope(u, 2.8, 0.45, 0.55);
      const wiggle = Math.sin(u * Math.PI * 4.4) * e;
      const hop = Math.abs(Math.sin(((u - 0.45) / 0.9) * Math.PI)) * 0.045 * envelope(u - 0.45, 1.8, 0.05, 0.05);
      return {
        face: e,
        pitch: 0.12 * e,
        squint: e,
        hop,
        right: { raise: 1.75 * e, forward: 0.2 * e, elbow: 0.65 * e + 0.25 * wiggle, hand: 0.2 * wiggle },
        left: { raise: 1.75 * e, forward: 0.2 * e, elbow: 0.65 * e - 0.25 * wiggle, hand: -0.2 * wiggle },
      };
    },
  },
  lookAround: {
    dur: 4.2,
    weight: 2,
    pose: (u) => ({
      yaw: 0.55 * (smooth(u / 0.9) - 2 * smooth((u - 1.6) / 1) + smooth((u - 3.2) / 0.9)),
      pitch: -0.05 * Math.sin(u * 1.5),
    }),
  },
  tilt: {
    dur: 2.6,
    weight: 2,
    pose: (u) => {
      const e = envelope(u, 2.6, 0.4, 0.6);
      const nod = Math.sin(u * Math.PI * 2.8) * 0.06 * envelope(u - 0.5, 1.4, 0.2, 0.2);
      return { face: e, roll: -0.32 * e, pitch: -0.08 * e + nod };
    },
  },
};
Object.assign(ACTIONS, {
  // Knee bounce on every beat, hips sway, arms pump in turn, head bobs, then a full spin to finish
  groove: {
    dur: 5.6,
    weight: 2,
    pose: (u) => {
      const e = envelope(u, 5.6, 0.4, 0.5);
      const beat = (u / BEAT) * Math.PI * 2;
      const bounce = (0.5 - 0.5 * Math.cos(beat)) * e;
      const sway = Math.sin(beat / 2) * e;
      const pump = Math.sin(beat);
      const leg = { lift: 0.3 * bounce, knee: 0.6 * bounce };
      return {
        face: e,
        pitch: 0.07 * Math.sin(beat) * e,
        dip: 0.03 * bounce,
        bodyX: 0.035 * sway,
        spineRoll: 0.1 * sway,
        rightLeg: leg,
        leftLeg: leg,
        right: { raise: (0.55 + 0.2 * pump) * e, forward: 0.5 * e, elbow: (1.5 + 0.25 * pump) * e },
        left: { raise: (0.55 - 0.2 * pump) * e, forward: 0.5 * e, elbow: (1.5 - 0.25 * pump) * e },
        spin: Math.PI * 2 * smooth((u - 3.9) / 1.1),
      };
    },
  },
  // Mechanical "robot" dance: snap to a new pose every beat, with a small dip on each snap
  robot: {
    dur: 5,
    weight: 2,
    pose: (u) => {
      const e = envelope(u, 5, 0.35, 0.45);
      const step = Math.floor(u / BEAT);
      const k = smooth((u - step * BEAT) / (BEAT * 0.3));
      const from = ROBOT_MOVES[(step + ROBOT_MOVES.length - 1) % ROBOT_MOVES.length];
      const to = ROBOT_MOVES[step % ROBOT_MOVES.length];
      const snap = Math.max(0, 1 - (u - step * BEAT) / (BEAT * 0.4));
      const scale = (arm) => ({ raise: arm.raise * e, forward: arm.forward * e, elbow: arm.elbow * e, hand: arm.hand * e });
      return {
        face: e,
        yaw: lerp(from.yaw, to.yaw, k) * e,
        pitch: lerp(from.pitch, to.pitch, k) * e,
        roll: lerp(from.roll, to.roll, k) * e,
        dip: 0.015 * snap * e,
        right: scale(lerpArm(from.right, to.right, k)),
        left: scale(lerpArm(from.left, to.left, k)),
      };
    },
  },
  // Disco: right hand points up to the sky, then down across the body; left hand on the hip, hips sway
  disco: {
    dur: 4.6,
    weight: 2,
    pose: (u) => {
      const e = envelope(u, 4.6, 0.4, 0.5);
      const up = smooth((Math.sin((u / (BEAT * 2)) * Math.PI * 2 - Math.PI / 2) + 1) / 2 * 1.4 - 0.2);
      const sway = Math.sin((u / (BEAT * 2)) * Math.PI * 2) * e;
      return {
        face: e,
        yaw: -0.25 * (1 - up) * e,
        pitch: (0.2 * up - 0.08) * e,
        bodyX: 0.03 * sway,
        spineRoll: 0.08 * sway,
        dip: 0.012 * (1 - up) * e,
        rightLeg: { lift: 0.15 * (1 - up) * e, knee: 0.3 * (1 - up) * e },
        right: { raise: lerp(-0.85, 2.25, up) * e, forward: lerp(0.7, 0.25, up) * e },
        left: { raise: 0.6 * e, forward: -0.1 * e, elbow: -1.8 * e },
      };
    },
  },
});

const pickAction = (last) => {
  const options = Object.entries(ACTIONS).filter(([name]) => name !== last);
  let r = Math.random() * options.reduce((sum, [, a]) => sum + a.weight, 0);
  for (const [name, a] of options) {
    r -= a.weight;
    if (r <= 0) return name;
  }
  return options[0][0];
};

/** Ask the hero robot to perform an action (e.g. from a hover handler): "point", "celebrate", "wave"… */
export const cueRobot = (action) => window.dispatchEvent(new CustomEvent("nb-robot", { detail: action }));

/**
 * Interactive 3D robot for the home hero. The CC0 model ships white and bronze; a shader remaps it
 * to glossy black armour with signal-orange accents and glowing eyes, lit by an orange-tinted
 * environment. It blinks, its antenna sways, a scan line sweeps it now and then, and between short
 * pauses it picks a random action (wave, point, celebrate, look around, head tilt, or one of three dances). Other components
 * can cue an action with `cueRobot`. Three.js is imported on the client only, after mount.
 */
export default function HeroRobot3D({ className = "", style }) {
  const mountRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      try {
        const THREE = await import("three");
        const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
        const { MeshoptDecoder } = await import("three/addons/libs/meshopt_decoder.module.js");
        if (disposed) return;

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
        // Phones get a lower pixel ratio: still crisp, far less GPU work
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.5 : 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        renderer.setClearColor(0x000000, 0);
        mount.appendChild(renderer.domElement);
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 20);
        camera.position.set(0.02, 0.9, 3.75);
        camera.lookAt(0.02, 0.8, 0);

        // Studio environment for reflections: dark room, a big orange panel, a white softbox and a cool fill
        const pmrem = new THREE.PMREMGenerator(renderer);
        const envScene = new THREE.Scene();
        envScene.background = new THREE.Color(0x050506);
        const panel = (color, intensity, w, h, pos) => {
          const m = new THREE.Mesh(
            new THREE.PlaneGeometry(w, h),
            new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }),
          );
          m.position.set(...pos);
          m.lookAt(0, 0, 0);
          envScene.add(m);
        };
        panel(0xff5a1f, 1.6, 2.5, 6, [5, 1, -2]);
        panel(0xff3b10, 0.8, 2, 3, [-4, -1, -3]);
        panel(0xffffff, 4, 4, 0.6, [0, 5, 2]);
        panel(0xffffff, 2.5, 0.4, 4, [-3, 1, 4]);
        panel(0x9fb4ff, 0.3, 3, 3, [-5, 1, 3]);
        const envMap = pmrem.fromScene(envScene, 0.04).texture;
        scene.environment = envMap;

        const rimRight = new THREE.DirectionalLight(0xff5a1f, 3.5);
        rimRight.position.set(2, 1.6, -1.2);
        const rimLeft = new THREE.DirectionalLight(0xff7a45, 1.2);
        rimLeft.position.set(-2.2, 1.2, -0.8);
        const key = new THREE.DirectionalLight(0xffffff, 0.6);
        key.position.set(0.6, 2, 2);
        scene.add(rimRight, rimLeft, key);

        const loader = new GLTFLoader();
        loader.setMeshoptDecoder(MeshoptDecoder);
        const gltf = await loader.loadAsync(MODEL_URL);
        if (disposed) return;
        const robot = gltf.scene;

        // Normalise: the file is in centimetres under a scaled armature; stand it 1.5 m tall, feet on y = 0
        robot.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(robot, true);
        const fit = MODEL_HEIGHT / (box.max.y - box.min.y);
        robot.scale.multiplyScalar(fit);
        robot.position.set(-((box.min.x + box.max.x) / 2) * fit, -box.min.y * fit, -((box.min.z + box.max.z) / 2) * fit);
        robot.updateMatrixWorld(true);

        let mesh = null;
        robot.traverse((obj) => {
          if (obj.isMesh && !mesh) mesh = obj;
        });

        // Shared by every material: eye brightness (0 = shut), the scan line, and the antenna bend
        const uniforms = {
          uEye: { value: 1 },
          uScanY: { value: SCAN_FROM },
          uScanA: { value: 0 },
          uAntBase: { value: new THREE.Vector3() },
          uAntUp: { value: new THREE.Vector3(0, 1, 0) },
          uAntLen: { value: 0 },
          uAntR: { value: 0 },
          uAntSway: { value: new THREE.Vector3() },
        };

        // Locate the antenna in the mesh's own (bind-pose) vertex space: it is the topmost part of the model
        const toLocal = mesh.matrixWorld.clone().invert();
        const up = new THREE.Vector3(0, 1, 0).transformDirection(toLocal);
        const pos = mesh.geometry.attributes.position;
        const v = new THREE.Vector3();
        let minH = Infinity;
        let maxH = -Infinity;
        for (let i = 0; i < pos.count; i++) {
          const h = v.fromBufferAttribute(pos, i).dot(up);
          if (h < minH) minH = h;
          if (h > maxH) maxH = h;
        }
        const localHeight = maxH - minH;
        const tip = new THREE.Vector3();
        let tipCount = 0;
        for (let i = 0; i < pos.count; i++) {
          v.fromBufferAttribute(pos, i);
          if (v.dot(up) > maxH - 0.02 * localHeight) {
            tip.add(v);
            tipCount++;
          }
        }
        tip.divideScalar(Math.max(tipCount, 1));
        tip.addScaledVector(up, -tip.dot(up)); // keep only the sideways position of the stem axis
        uniforms.uAntUp.value.copy(up);
        uniforms.uAntBase.value.copy(tip).addScaledVector(up, maxH - ANT_BASE * localHeight);
        uniforms.uAntLen.value = (ANT_BASE - ANT_TIP) * localHeight;
        uniforms.uAntR.value = ANT_RADIUS * localHeight;
        const side1 = new THREE.Vector3().crossVectors(up, Math.abs(up.x) < 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1)).normalize();
        const side2 = new THREE.Vector3().crossVectors(up, side1).normalize();
        const metre = localHeight / MODEL_HEIGHT; // local units per metre

        const materials = [];
        robot.traverse((obj) => {
          if (!obj.isMesh) return;
          const src = obj.material;
          const mat = new THREE.MeshPhysicalMaterial({
            map: src.map,
            normalMap: src.normalMap,
            metalnessMap: src.metalnessMap,
            roughnessMap: src.roughnessMap,
            clearcoat: 1,
            clearcoatRoughness: 0.08,
            envMapIntensity: 1,
            emissive: new THREE.Color(0xff5a1f),
          });
          mat.onBeforeCompile = (shader) => {
            Object.assign(shader.uniforms, uniforms);
            shader.vertexShader = shader.vertexShader
              .replace(
                "#include <common>",
                "#include <common>\nvarying float vNbY;\nuniform vec3 uAntBase;\nuniform vec3 uAntUp;\nuniform float uAntLen;\nuniform float uAntR;\nuniform vec3 uAntSway;",
              )
              .replace(
                "#include <begin_vertex>",
                `#include <begin_vertex>
                // Bend the antenna: weight grows from 0 at its base to 1 at the tip, only inside the stem column
                vec3 nbRel = transformed - uAntBase;
                float nbH = dot(nbRel, uAntUp);
                float nbAntD = length(nbRel - nbH * uAntUp);
                float nbAntW = (1.0 - smoothstep(uAntR, uAntR * 1.3, nbAntD)) * smoothstep(0.0, uAntLen, nbH);
                float nbBend = nbAntW * nbAntW;
                transformed += uAntSway * nbBend;
                transformed -= uAntUp * dot(uAntSway, uAntSway) * nbBend * 0.5 / max(uAntLen, 1e-4);
                vNbY = (modelMatrix * vec4(transformed, 1.0)).y;`,
              );
            shader.fragmentShader = shader.fragmentShader
              .replace(
                "#include <common>",
                "#include <common>\nvarying float vNbY;\nuniform float uEye;\nuniform float uScanY;\nuniform float uScanA;",
              )
              .replace(
                "#include <map_fragment>",
                `#include <map_fragment>
                vec3 nbSrc = diffuseColor.rgb;
                float nbEye = smoothstep(0.18, 0.4, nbSrc.b - max(nbSrc.r, nbSrc.g));
                float nbAccent = smoothstep(0.1, 0.28, nbSrc.r - nbSrc.b) * (1.0 - nbEye);
                diffuseColor.rgb = mix(vec3(0.012, 0.012, 0.014), vec3(0.7, 0.16, 0.04), nbAccent);`,
              )
              .replace(
                "#include <roughnessmap_fragment>",
                `#include <roughnessmap_fragment>
                roughnessFactor = mix(0.16, 0.32, nbAccent);`,
              )
              .replace(
                "#include <metalnessmap_fragment>",
                `#include <metalnessmap_fragment>
                metalnessFactor = mix(0.55, 0.95, nbAccent);`,
              )
              .replace(
                "#include <emissivemap_fragment>",
                `#include <emissivemap_fragment>
                totalEmissiveRadiance *= nbEye * 6.0 * uEye;
                float nbBand = 1.0 - smoothstep(0.0, 0.012, abs(vNbY - uScanY));
                float nbTrail = smoothstep(0.12, 0.0, vNbY - uScanY) * step(uScanY, vNbY) * 0.25;
                totalEmissiveRadiance += vec3(1.0, 0.35, 0.12) * (nbBand * 2.5 + nbTrail) * uScanA;`,
              );
          };
          obj.material = mat;
          materials.push(mat);
        });

        // Bones for the actions. Rest pose is restored every frame, then rotations are layered on about
        // the robot's own axes (the bones' local axes are arbitrary in this file).
        const bone = (name) => robot.getObjectByName(name);
        const bones = {
          neck: bone("neck"),
          head: bone("Head"),
          arm: bone("RightArm"),
          forearm: bone("RightForeArm"),
          hand: bone("RightHand"),
          leftArm: bone("LeftArm"),
          leftForearm: bone("LeftForeArm"),
          leftHand: bone("LeftHand"),
          spine: bone("Spine01"),
          rightUpLeg: bone("RightUpLeg"),
          rightLeg: bone("RightLeg"),
          leftUpLeg: bone("LeftUpLeg"),
          leftLeg: bone("LeftLeg"),
        };
        const restPose = Object.values(bones)
          .filter(Boolean)
          .map((b) => [b, b.quaternion.clone()]);
        const canWave = Boolean(bones.arm && bones.forearm && bones.head);

        // Which way is the robot's right hand (sign on x) and which way does it face (sign on z)?
        const toRobot = robot.matrixWorld.clone().invert();
        const local = (obj) => obj.getWorldPosition(new THREE.Vector3()).applyMatrix4(toRobot);
        const handSide = canWave ? Math.sign(local(bones.hand || bones.forearm).x - local(bones.head).x) || -1 : -1;
        const front = bone("headfront");
        const faceSign = front && bones.head ? Math.sign(local(front).z - local(bones.head).z) || 1 : 1;

        const robotQuat = new THREE.Quaternion();
        const parentQuat = new THREE.Quaternion();
        const turn = new THREE.Quaternion();
        const axisX = new THREE.Vector3(1, 0, 0);
        const axisY = new THREE.Vector3(0, 1, 0);
        const axisZ = new THREE.Vector3(0, 0, 1);
        const axis = new THREE.Vector3();
        const rotateAbout = (b, robotAxis, angle) => {
          if (!b || !angle) return;
          b.parent.updateWorldMatrix(true, false);
          b.parent.getWorldQuaternion(parentQuat).invert();
          axis.copy(robotAxis).applyQuaternion(robotQuat).applyQuaternion(parentQuat).normalize();
          b.quaternion.premultiply(turn.setFromAxisAngle(axis, angle));
        };

        const poseArm = (upper, lower, hand, side, p) => {
          if (!p) return;
          rotateAbout(upper, axisZ, side * (p.raise || 0));
          rotateAbout(upper, axisX, -faceSign * (p.forward || 0));
          rotateAbout(lower, axisZ, side * (p.elbow || 0));
          rotateAbout(hand, axisZ, side * (p.hand || 0));
        };
        const pose = (p) => {
          for (const [b, q] of restPose) b.quaternion.copy(q);
          if (!canWave) return;
          robot.getWorldQuaternion(robotQuat);
          // Head: `face` undoes the body's three-quarter turn so it looks at the viewer; yaw turns towards the headline
          const yaw = (p.face || 0) * -robot.rotation.y + handSide * faceSign * (p.yaw || 0);
          rotateAbout(bones.neck, axisY, yaw * 0.5);
          rotateAbout(bones.head, axisY, yaw * 0.5);
          rotateAbout(bones.head, axisZ, -handSide * (p.roll || 0));
          rotateAbout(bones.head, axisX, -faceSign * (p.pitch || 0));
          poseArm(bones.arm, bones.forearm, bones.hand, handSide, p.right);
          poseArm(bones.leftArm, bones.leftForearm, bones.leftHand, -handSide, p.left);
          // Legs: lift swings the thigh forward, knee folds the shin back; spine leans with the sway
          for (const [upper, lower, leg] of [
            [bones.rightUpLeg, bones.rightLeg, p.rightLeg],
            [bones.leftUpLeg, bones.leftLeg, p.leftLeg],
          ]) {
            if (!leg) continue;
            rotateAbout(upper, axisX, -faceSign * (leg.lift || 0));
            rotateAbout(lower, axisX, faceSign * (leg.knee || 0));
          }
          rotateAbout(bones.spine, axisZ, p.spineRoll || 0);
        };

        // Three-quarter view: turn the body away slightly
        const pivot = new THREE.Group();
        pivot.add(robot);
        robot.rotation.y = -0.3;
        scene.add(pivot);

        // Floor: a soft orange pool of light under the feet so the robot stands on something
        const glowCanvas = document.createElement("canvas");
        glowCanvas.width = glowCanvas.height = 128;
        const g = glowCanvas.getContext("2d");
        const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, "rgba(255,90,31,0.38)");
        grad.addColorStop(0.35, "rgba(255,90,31,0.12)");
        grad.addColorStop(1, "rgba(255,90,31,0)");
        g.fillStyle = grad;
        g.fillRect(0, 0, 128, 128);
        const glowTexture = new THREE.CanvasTexture(glowCanvas);
        glowTexture.colorSpace = THREE.SRGBColorSpace;
        const floor = new THREE.Mesh(
          new THREE.PlaneGeometry(1.6, 1.6),
          new THREE.MeshBasicMaterial({ map: glowTexture, transparent: true, depthWrite: false, toneMapped: false, blending: THREE.NormalBlending }),
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0.002;
        scene.add(floor);

        const resize = () => {
          const { clientWidth: w, clientHeight: h } = mount;
          if (!w || !h) return;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(mount);

        // Follow the pointer anywhere on the page, eased
        const target = { x: 0, y: 0 };
        const onPointer = (e) => {
          target.x = (e.clientX / window.innerWidth) * 2 - 1;
          target.y = (e.clientY / window.innerHeight) * 2 - 1;
        };
        window.addEventListener("pointermove", onPointer, { passive: true });

        let visible = true;
        const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
        io.observe(mount);

        // Action scheduler: start with a wave, then random actions with 2–5s pauses; cues jump the queue
        let action = { name: "wave", start: 1.2 };
        let lastAction = null;
        let idleUntil = 0;
        let queued = null;
        const onCue = (e) => {
          if (!ACTIONS[e.detail]) return;
          if (!action) action = { name: e.detail, start: clock.getElapsedTime() };
          else if (action.name !== e.detail) queued = e.detail;
        };
        window.addEventListener("nb-robot", onCue);

        const clock = new THREE.Clock();
        let followYaw = 0;
        let followPitch = 0;
        let blink = { at: 1.5, length: 0.16, depth: 1 };
        let nextPing = 2;
        let pingAt = -10;
        const pingDir = new THREE.Vector2(1, 0);
        let raf = 0;
        const tick = () => {
          raf = requestAnimationFrame(tick);
          if (!visible || document.hidden) return;
          const t = clock.getElapsedTime();
          followYaw += (target.x * 0.35 - followYaw) * 0.05;
          followPitch += (target.y * 0.08 - followPitch) * 0.05;
          rimRight.intensity = 3.5 + Math.sin(t * 1.7) * 0.8;
          if (action && t - action.start >= ACTIONS[action.name].dur) {
            lastAction = action.name;
            action = null;
            idleUntil = t + (queued ? 0.2 : 2 + Math.random() * 3);
          }
          if (!action && t >= idleUntil) {
            action = { name: queued || pickAction(lastAction), start: t };
            queued = null;
          }
          const p = action && t >= action.start ? ACTIONS[action.name].pose(t - action.start) : {};
          pivot.rotation.set(followPitch, followYaw + (p.spin || 0), 0);
          pivot.position.set(p.bodyX || 0, Math.sin(t * 1.1) * 0.012 + (p.hop || 0) - (p.dip || 0), 0);
          pivot.updateMatrixWorld(true);
          pose(p);

          // Blink: shut over the first 35% of the blink, reopen more slowly over the rest
          const since = t - blink.at;
          if (since >= 0 && since < blink.length) {
            const k = since / blink.length;
            const closed = k < 0.35 ? k / 0.35 : 1 - (k - 0.35) / 0.65;
            uniforms.uEye.value = 1 - blink.depth * Math.sin((closed * Math.PI) / 2);
          } else if (since >= blink.length) {
            uniforms.uEye.value = 1;
            blink = nextBlinkPlan(t);
          } else {
            uniforms.uEye.value = 0.9 + Math.sin(t * 3) * 0.1;
          }
          uniforms.uEye.value *= 1 - 0.5 * (p.squint || 0);

          // Antenna: a slow searching wobble, plus a sharp damped twitch now and then, as if it "hears" something
          if (t >= nextPing) {
            pingAt = t;
            pingDir.set(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
            nextPing = t + 3 + Math.random() * 3;
          }
          const sincePing = t - pingAt;
          const twitch = 0.03 * Math.exp(-sincePing * 5) * Math.sin(sincePing * 26);
          const swayA = (Math.sin(t * 1.3) * 0.012 + pingDir.x * twitch) * metre;
          const swayB = (Math.cos(t * 0.9) * 0.008 + pingDir.y * twitch) * metre;
          uniforms.uAntSway.value.copy(side1).multiplyScalar(swayA).addScaledVector(side2, swayB);

          // Scan: sweep down, fading in and out at the ends
          const s = (t % SCAN_EVERY) / SCAN_TIME;
          if (s < 1) {
            uniforms.uScanY.value = SCAN_FROM + (SCAN_TO - SCAN_FROM) * s;
            uniforms.uScanA.value = Math.sin(s * Math.PI);
          } else {
            uniforms.uScanA.value = 0;
          }

          renderer.render(scene, camera);
        };
        if (reduceMotion) {
          renderer.render(scene, camera);
          window.removeEventListener("pointermove", onPointer);
        } else {
          tick();
        }
        setStatus("ready");

        cleanup = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          io.disconnect();
          window.removeEventListener("pointermove", onPointer);
          window.removeEventListener("nb-robot", onCue);
          robot.traverse((obj) => {
            if (!obj.isMesh) return;
            obj.geometry.dispose();
          });
          for (const mat of materials) {
            mat.map?.dispose();
            mat.normalMap?.dispose();
            mat.metalnessMap?.dispose();
            mat.dispose();
          }
          floor.geometry.dispose();
          floor.material.dispose();
          glowTexture.dispose();
          envMap.dispose();
          pmrem.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
      } catch (err) {
        console.error("Hero robot failed to load:", err);
        if (!disposed) setStatus("error");
      }
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  // Until three.js and the model arrive, show a still render of the same scene (camera, pose, 1.6:1). The
  // camera keeps a fixed vertical FOV centred on the robot, so a height-fitted, centred image lines up
  // with the live canvas and the two cross-fade without a jump. It stays up if WebGL fails.
  return (
    <div role="img" aria-label="NewtonBotics robot mascot, rendered in 3D" style={style} className={`overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- local still, sized by height to match the canvas */}
      <img
        src={POSTER_URL}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="async"
        className={`absolute left-1/2 top-0 h-full w-auto max-w-none -translate-x-1/2 transition-opacity duration-700 ${
          status === "ready" ? "opacity-0" : "opacity-100"
        }`}
      />
      <div
        ref={mountRef}
        className={`absolute inset-0 transition-opacity duration-700 ${status === "ready" ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
