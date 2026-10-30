/**
 * demoData.js — NewtonBotics Demo Mode mock data
 *
 * This file is ONLY loaded when NEXT_PUBLIC_DEMO_MODE=true.
 * Demo records are entirely local; they are never sent to any API.
 * Real backend data is never mixed with or replaced by demo data at runtime
 * when demo mode is disabled.
 */

// ─── Categories ───────────────────────────────────────────────────────────────
export const DEMO_CATEGORIES = [
  { _id: "cat-001", name: "Microcontrollers", description: "Programmable control boards for robotics systems" },
  { _id: "cat-002", name: "Sensors", description: "Environmental and motion sensing modules" },
  { _id: "cat-003", name: "Actuators", description: "Motors, servos and linear actuators" },
  { _id: "cat-004", name: "Power Supply", description: "Batteries, regulators and power management" },
  { _id: "cat-005", name: "Communication", description: "Wireless and wired communication modules" },
  { _id: "cat-006", name: "Structural", description: "Frames, chassis and mechanical hardware" },
  { _id: "cat-007", name: "Vision", description: "Cameras and image processing hardware" },
  { _id: "cat-008", name: "Tools & Test Equipment", description: "Lab instruments and hand tools" },
];

// ─── General Lab Equipment ─────────────────────────────────────────────────────
export const DEMO_EQUIPMENT = [
  // Microcontrollers
  {
    _id: "eq-001", name: "Arduino Mega 2560",
    description: "ATmega2560-based board with 54 digital I/O pins, 16 analog inputs, 4 UARTs.",
    categoryId: { _id: "cat-001", name: "Microcontrollers" },
    currentQuantity: 8, minQuantity: 2, maxQuantity: 15,
    status: "available",
    manufacturer: "Arduino", modelNumber: "A000067",
    location: "Cabinet A-1", purchasePrice: "3200",
    imageUrl: "",
    specifications: [
      { key: "Clock Speed", value: "16 MHz" },
      { key: "Flash Memory", value: "256 KB" },
      { key: "Operating Voltage", value: "5V" },
    ]
  },
  {
    _id: "eq-002", name: "Raspberry Pi 4 Model B (4 GB)",
    description: "Quad-core Cortex-A72 SBC with 4 GB RAM. Ideal for vision and AI tasks on the robot.",
    categoryId: { _id: "cat-001", name: "Microcontrollers" },
    currentQuantity: 3, minQuantity: 1, maxQuantity: 6,
    status: "available",
    manufacturer: "Raspberry Pi Foundation", modelNumber: "SC0193",
    location: "Cabinet A-2", purchasePrice: "5500",
    imageUrl: "",
  },
  {
    _id: "eq-003", name: "ESP32 Dev Kit",
    description: "Dual-core 240 MHz MCU with integrated WiFi and Bluetooth. Great for IoT projects.",
    categoryId: { _id: "cat-001", name: "Microcontrollers" },
    currentQuantity: 14, minQuantity: 5, maxQuantity: 30,
    status: "available",
    manufacturer: "Espressif", modelNumber: "ESP32-WROOM-32",
    location: "Drawer B-3", purchasePrice: "650",
    imageUrl: "",
  },
  {
    _id: "eq-004", name: "STM32 Nucleo-F446RE",
    description: "ARM Cortex-M4 dev board. Used in advanced motor control and RTOS projects.",
    categoryId: { _id: "cat-001", name: "Microcontrollers" },
    currentQuantity: 2, minQuantity: 2, maxQuantity: 8,
    status: "available",
    manufacturer: "STMicroelectronics", modelNumber: "NUCLEO-F446RE",
    location: "Cabinet A-3", purchasePrice: "1800",
    imageUrl: "",
  },

  // Sensors
  {
    _id: "eq-005", name: "MPU-6050 IMU",
    description: "6-axis gyroscope + accelerometer. Used for orientation sensing in drones and bots.",
    categoryId: { _id: "cat-002", name: "Sensors" },
    currentQuantity: 1, minQuantity: 3, maxQuantity: 20,
    status: "available",
    manufacturer: "InvenSense", modelNumber: "MPU-6050",
    location: "Drawer B-1", purchasePrice: "280",
    imageUrl: "",
  },
  {
    _id: "eq-006", name: "HC-SR04 Ultrasonic Sensor",
    description: "Distance measurement 2–400 cm. Widely used for obstacle avoidance.",
    categoryId: { _id: "cat-002", name: "Sensors" },
    currentQuantity: 18, minQuantity: 5, maxQuantity: 30,
    status: "available",
    manufacturer: "Generic", modelNumber: "HC-SR04",
    location: "Drawer B-2", purchasePrice: "120",
    imageUrl: "",
  },
  {
    _id: "eq-007", name: "LiDAR RP-Lidar A1",
    description: "360° 2D LiDAR scanner, 6 m range. Used for SLAM and mapping research.",
    categoryId: { _id: "cat-002", name: "Sensors" },
    currentQuantity: 0, minQuantity: 1, maxQuantity: 3,
    status: "available",
    manufacturer: "Slamtec", modelNumber: "RPLIDAR-A1M8",
    location: "Shelf C-1", purchasePrice: "18000",
    imageUrl: "",
  },
  {
    _id: "eq-008", name: "MQ-2 Gas Sensor",
    description: "Detects LPG, propane, hydrogen. Used in safety monitoring systems.",
    categoryId: { _id: "cat-002", name: "Sensors" },
    currentQuantity: 9, minQuantity: 2, maxQuantity: 15,
    status: "available",
    manufacturer: "Hanwei Electronics", modelNumber: "MQ-2",
    location: "Drawer B-4", purchasePrice: "95",
    imageUrl: "",
  },

  // Actuators
  {
    _id: "eq-009", name: "MG996R Servo Motor",
    description: "Metal gear servo, 11 kg·cm torque. Standard for robotic arms and pan-tilt rigs.",
    categoryId: { _id: "cat-003", name: "Actuators" },
    currentQuantity: 12, minQuantity: 4, maxQuantity: 24,
    status: "available",
    manufacturer: "TowerPro", modelNumber: "MG996R",
    location: "Cabinet D-1", purchasePrice: "380",
    imageUrl: "",
  },
  {
    _id: "eq-010", name: "NEMA 17 Stepper Motor",
    description: "1.8°/step bipolar stepper. Used in CNC, 3D printing and precise positioning.",
    categoryId: { _id: "cat-003", name: "Actuators" },
    currentQuantity: 6, minQuantity: 2, maxQuantity: 12,
    status: "available",
    manufacturer: "Pololu", modelNumber: "2267",
    location: "Cabinet D-2", purchasePrice: "750",
    imageUrl: "",
  },
  {
    _id: "eq-011", name: "BTS7960 H-Bridge Motor Driver",
    description: "43 A peak dual H-bridge. Drives high-power DC motors for wheeled robots.",
    categoryId: { _id: "cat-003", name: "Actuators" },
    currentQuantity: 0, minQuantity: 2, maxQuantity: 8,
    status: "maintenance",
    manufacturer: "Various", modelNumber: "BTS7960B",
    location: "Cabinet D-3", purchasePrice: "320",
    imageUrl: "",
  },

  // Power Supply
  {
    _id: "eq-012", name: "11.1V 5000 mAh LiPo Battery",
    description: "3S LiPo pack with XT60 connector. Standard power source for mobile robots.",
    categoryId: { _id: "cat-004", name: "Power Supply" },
    currentQuantity: 4, minQuantity: 2, maxQuantity: 10,
    status: "available",
    manufacturer: "Gens Ace", modelNumber: "B-50C-5000-3S1P",
    location: "Fireproof Cabinet E-1", purchasePrice: "3200",
    imageUrl: "",
  },
  {
    _id: "eq-013", name: "LM7805 Voltage Regulator",
    description: "+5V linear regulator. Bulk stock for breadboard prototyping.",
    categoryId: { _id: "cat-004", name: "Power Supply" },
    currentQuantity: 35, minQuantity: 10, maxQuantity: 50,
    status: "available",
    manufacturer: "Texas Instruments", modelNumber: "LM7805",
    location: "Drawer F-1", purchasePrice: "18",
    imageUrl: "",
  },

  // Communication
  {
    _id: "eq-014", name: "NRF24L01+ 2.4 GHz Transceiver",
    description: "2 Mbps wireless transceiver. Used for inter-robot communication.",
    categoryId: { _id: "cat-005", name: "Communication" },
    currentQuantity: 10, minQuantity: 4, maxQuantity: 20,
    status: "available",
    manufacturer: "Nordic Semiconductor", modelNumber: "nRF24L01+",
    location: "Drawer B-5", purchasePrice: "150",
    imageUrl: "",
  },
  {
    _id: "eq-015", name: "LoRa SX1278 Module",
    description: "433 MHz LoRa module. Long-range communication for outdoor robotics.",
    categoryId: { _id: "cat-005", name: "Communication" },
    currentQuantity: 5, minQuantity: 2, maxQuantity: 10,
    status: "available",
    manufacturer: "Semtech", modelNumber: "SX1278",
    location: "Drawer B-6", purchasePrice: "420",
    imageUrl: "",
  },

  // Structural
  {
    _id: "eq-016", name: "Aluminium Extrusion 20×20 mm (1 m)",
    description: "T-slot aluminium profile. Used for custom robot frames and enclosures.",
    categoryId: { _id: "cat-006", name: "Structural" },
    currentQuantity: 22, minQuantity: 10, maxQuantity: 50,
    status: "available",
    manufacturer: "Misumi", modelNumber: "HFS5-2020-1000",
    location: "Storage Rack G-1", purchasePrice: "280",
    imageUrl: "",
  },
  {
    _id: "eq-017", name: "M3 Bolt & Nut Assortment Kit",
    description: "500-piece M3 stainless steel hardware kit. Lengths: 6–30 mm.",
    categoryId: { _id: "cat-006", name: "Structural" },
    currentQuantity: 7, minQuantity: 2, maxQuantity: 15,
    status: "available",
    manufacturer: "Various", modelNumber: "M3-ASSORT-500",
    location: "Hardware Drawer H-1", purchasePrice: "350",
    imageUrl: "",
  },

  // Vision
  {
    _id: "eq-018", name: "Logitech C920 Webcam",
    description: "1080p/30fps USB webcam. Paired with OpenCV for computer vision tasks.",
    categoryId: { _id: "cat-007", name: "Vision" },
    currentQuantity: 3, minQuantity: 1, maxQuantity: 6,
    status: "available",
    manufacturer: "Logitech", modelNumber: "C920",
    location: "Cabinet A-4", purchasePrice: "4500",
    imageUrl: "",
  },
  {
    _id: "eq-019", name: "Intel RealSense D435 Depth Camera",
    description: "RGB-D camera for 3D perception. Used in manipulation and navigation research.",
    categoryId: { _id: "cat-007", name: "Vision" },
    currentQuantity: 1, minQuantity: 1, maxQuantity: 3,
    status: "available",
    manufacturer: "Intel", modelNumber: "82635AWG",
    location: "Secure Cabinet I-1", purchasePrice: "22000",
    imageUrl: "",
  },

  // Tools
  {
    _id: "eq-020", name: "Hakko FX-888D Soldering Station",
    description: "Digital temperature-controlled soldering iron. Standard workbench tool.",
    categoryId: { _id: "cat-008", name: "Tools & Test Equipment" },
    currentQuantity: 4, minQuantity: 2, maxQuantity: 6,
    status: "available",
    manufacturer: "Hakko", modelNumber: "FX-888D",
    location: "Workbench W-1", purchasePrice: "8500",
    imageUrl: "",
  },
  {
    _id: "eq-021", name: "Rigol DS1054Z Oscilloscope",
    description: "50 MHz 4-channel DSO. Essential for electronics debugging.",
    categoryId: { _id: "cat-008", name: "Tools & Test Equipment" },
    currentQuantity: 2, minQuantity: 1, maxQuantity: 4,
    status: "available",
    manufacturer: "Rigol", modelNumber: "DS1054Z",
    location: "Workbench W-2", purchasePrice: "28000",
    imageUrl: "",
  },
  {
    _id: "eq-022", name: "Fluke 117 True-RMS Multimeter",
    description: "Commercial-grade DMM with non-contact voltage detection.",
    categoryId: { _id: "cat-008", name: "Tools & Test Equipment" },
    currentQuantity: 5, minQuantity: 2, maxQuantity: 8,
    status: "available",
    manufacturer: "Fluke", modelNumber: "FLUKE-117",
    location: "Tool Cabinet T-1", purchasePrice: "12000",
    imageUrl: "",
  },
];

// ─── Demo Projects ─────────────────────────────────────────────────────────────
export const DEMO_PROJECTS = [
  {
    _id: "proj-001",
    title: "HexBot — Hexapod Walking Robot",
    description: "Six-legged autonomous walker with terrain-adaptive gait algorithms and LiDAR-based obstacle avoidance.",
    status: "ongoing",
    category: "Autonomous Robotics",
    isFeatured: true,
    startDate: "2025-08-12",
    imageUrl: "",
    teamLeaderId: { _id: "u-001", firstName: "Ananya", lastName: "Sharma" },
    teamMembers: [
      { _id: "u-001", firstName: "Ananya", lastName: "Sharma", role: "Team Lead" },
      { _id: "u-011", firstName: "Kabir", lastName: "Nair", role: "Embedded" },
      { _id: "u-012", firstName: "Meera", lastName: "Iyer", role: "Mechanical" },
    ],
    tags: ["hexapod", "lidar", "gait"],
  },
  {
    _id: "proj-002",
    title: "AeroVision Drone",
    description: "Quadcopter with onboard Raspberry Pi and computer-vision payload for aerial mapping.",
    status: "ongoing",
    category: "Aerial Robotics",
    isFeatured: true,
    startDate: "2025-09-01",
    imageUrl: "",
    teamLeaderId: { _id: "u-002", firstName: "Rohan", lastName: "Mehta" },
    teamMembers: [
      { _id: "u-002", firstName: "Rohan", lastName: "Mehta", role: "Team Lead" },
      { _id: "u-021", firstName: "Sara", lastName: "Khan", role: "Vision" },
    ],
    tags: ["drone", "opencv", "mapping"],
  },
  {
    _id: "proj-003",
    title: "RoboArm Mk II",
    description: "6-DOF robotic arm controlled via inverse kinematics. Designed for object sorting in constrained spaces.",
    status: "completed",
    category: "Manipulation",
    isFeatured: false,
    startDate: "2024-11-20",
    endDate: "2025-06-15",
    imageUrl: "",
    teamLeaderId: { _id: "u-003", firstName: "Priya", lastName: "Gupta" },
    teamMembers: [
      { _id: "u-003", firstName: "Priya", lastName: "Gupta", role: "Team Lead" },
      { _id: "u-031", firstName: "Arjun", lastName: "Desai", role: "Controls" },
    ],
    tags: ["manipulator", "kinematics"],
  },
  {
    _id: "proj-004",
    title: "SwarmBot Network",
    description: "Multi-robot coordination system for collaborative warehouse navigation tasks.",
    status: "upcoming",
    category: "Swarm Robotics",
    isFeatured: false,
    startDate: "2026-01-10",
    imageUrl: "",
    teamLeaderId: { _id: "u-004", firstName: "Vikram", lastName: "Singh" },
    teamMembers: [
      { _id: "u-004", firstName: "Vikram", lastName: "Singh", role: "Team Lead" },
      { _id: "u-041", firstName: "Neha", lastName: "Patel", role: "Networking" },
      { _id: "u-042", firstName: "Dev", lastName: "Rao", role: "Firmware" },
    ],
    tags: ["swarm", "mesh", "warehouse"],
  },
];

// ─── Project-specific demo inventory ──────────────────────────────────────────
export const DEMO_PROJECT_INVENTORY = {
  "proj-001": [
    { _id: "pi-001-1", name: "MG996R Servo Motor", categoryId: { _id: "cat-003", name: "Actuators" }, currentQuantity: 6, minQuantity: 6, maxQuantity: 6, status: "available", location: "Project Box HX-A", description: "Leg joints — 1 per leg" },
    { _id: "pi-001-2", name: "ESP32 Dev Kit", categoryId: { _id: "cat-001", name: "Microcontrollers" }, currentQuantity: 1, minQuantity: 1, maxQuantity: 1, status: "available", location: "Project Box HX-A", description: "Gait controller" },
    { _id: "pi-001-3", name: "RP-Lidar A1", categoryId: { _id: "cat-002", name: "Sensors" }, currentQuantity: 1, minQuantity: 1, maxQuantity: 1, status: "available", location: "Project Box HX-B", description: "Obstacle avoidance sensor" },
    { _id: "pi-001-4", name: "11.1V 5000mAh LiPo", categoryId: { _id: "cat-004", name: "Power Supply" }, currentQuantity: 2, minQuantity: 1, maxQuantity: 2, status: "available", location: "Fireproof Cabinet", description: "Primary power + spare" },
  ],
  "proj-002": [
    { _id: "pi-002-1", name: "Raspberry Pi 4 Model B", categoryId: { _id: "cat-001", name: "Microcontrollers" }, currentQuantity: 1, minQuantity: 1, maxQuantity: 1, status: "available", location: "Drone Box AV-1", description: "Vision compute node" },
    { _id: "pi-002-2", name: "Logitech C920 Webcam", categoryId: { _id: "cat-007", name: "Vision" }, currentQuantity: 1, minQuantity: 1, maxQuantity: 1, status: "available", location: "Drone Box AV-1", description: "Downward-facing mapping camera" },
    { _id: "pi-002-3", name: "NRF24L01+ Transceiver", categoryId: { _id: "cat-005", name: "Communication" }, currentQuantity: 2, minQuantity: 1, maxQuantity: 2, status: "available", location: "Drone Box AV-2", description: "Drone ↔ Ground control link" },
  ],
  "proj-003": [
    { _id: "pi-003-1", name: "NEMA 17 Stepper Motor", categoryId: { _id: "cat-003", name: "Actuators" }, currentQuantity: 5, minQuantity: 5, maxQuantity: 5, status: "available", location: "Arm Storage RA-1", description: "One per joint (shoulder×2, elbow, wrist×2)" },
    { _id: "pi-003-2", name: "Arduino Mega 2560", categoryId: { _id: "cat-001", name: "Microcontrollers" }, currentQuantity: 1, minQuantity: 1, maxQuantity: 1, status: "available", location: "Arm Storage RA-1", description: "Inverse kinematics controller" },
  ],
  "proj-004": [
    { _id: "pi-004-1", name: "ESP32 Dev Kit", categoryId: { _id: "cat-001", name: "Microcontrollers" }, currentQuantity: 4, minQuantity: 4, maxQuantity: 6, status: "available", location: "Swarm Box SW-1", description: "One per bot (4 bots planned)" },
    { _id: "pi-004-2", name: "NRF24L01+ Transceiver", categoryId: { _id: "cat-005", name: "Communication" }, currentQuantity: 4, minQuantity: 4, maxQuantity: 6, status: "available", location: "Swarm Box SW-1", description: "Mesh network modules" },
    { _id: "pi-004-3", name: "HC-SR04 Ultrasonic Sensor", categoryId: { _id: "cat-002", name: "Sensors" }, currentQuantity: 8, minQuantity: 4, maxQuantity: 12, status: "available", location: "Swarm Box SW-2", description: "2 per bot for proximity sensing" },
  ],
};

export const DEMO_COMPONENT_REQUESTS = [
  {
    _id: "cr-001",
    requesterId: "u-001",
    projectId: "proj-001",
    projectTitle: "HexBot — Hexapod Walking Robot",
    componentName: "MPU-6050 IMU",
    quantity: 2,
    purpose: "Add a redundant orientation sensor while validating the new gait controller.",
    status: "pending",
    createdAt: "2026-10-24T09:30:00.000Z",
  },
  {
    _id: "cr-002",
    requesterId: "u-001",
    projectId: "proj-001",
    projectTitle: "HexBot — Hexapod Walking Robot",
    componentName: "MG996R Servo Motor",
    quantity: 2,
    purpose: "Keep two spare servos available for the leg-load endurance test.",
    status: "approved",
    createdAt: "2026-10-18T14:10:00.000Z",
  },
  {
    _id: "cr-003",
    requesterId: "u-001",
    projectId: "proj-001",
    projectTitle: "HexBot — Hexapod Walking Robot",
    componentName: "LiDAR RP-Lidar A1",
    quantity: 1,
    purpose: "Evaluate a second scanner for mapping in the indoor test course.",
    status: "rejected",
    createdAt: "2026-10-10T11:45:00.000Z",
  },
];

export const DEMO_REQUEST_USER = {
  id: "u-001",
  firstName: "Ananya",
  lastName: "Sharma",
};
