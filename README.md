🌿 Dynamic Garden Simulator (v0.5.0)
An interactive, web-based gamified farming application designed to demonstrate core Data Structures and Algorithms (DSA) principles through real-time simulation, scalable grid logic, and embedded Python execution via WebAssembly.
🚀 Key Features & DSA Implementation (Topics 1–5)
Topic 1: Python OOP & Game State Engine
Utilizes object-oriented programming (PlantNode, BSTNode) and structured JavaScript schemas to model crops, pets, and tools.
Topic 2: Queues & FIFO Task Processing
Employs First-In, First-Out (FIFO) queue principles to handle automated background tasks and climate event triggers sequentially.
Topic 3: 2D Matrix Grid Coordinates (gardenGridState)
Manages scalable N \times N plot layouts (defaulting to 5x5) using numerical coordinate indexing for O(1) rapid lookups, planting, watering, and harvesting.
Topic 4: Hierarchical Trees & Traversals (BFS & DFS in Gacha Mechanics)
Structures plant taxonomy into a classification tree. BFS Level-Order and DFS (Preorder, Inorder, Postorder) algorithms are actively integrated into the live Mystery Seed & Universal Egg Hatching gacha system to filter and roll rare rewards dynamically.
Topic 5: Binary Search Trees (BST) & Soil Analysis
Implements a BST structure to organize and search soil pH levels efficiently through node insertion and traversal.
Interactive Pet Companion System: Stackable passive buffs (growth speed, mutation rates, bulk discounts, and auto-watering bots).
Embedded Python Terminal (Pyodide): Runs Python scripts directly inside the browser console to test algorithms in real-time.
💻 Tech Stack
Frontend: HTML5, Tailwind CSS, Vanilla JavaScript (DOM Manipulation)
Icons & Styling: Lucide Icons, Custom CSS Glassmorphism & Keyframe Animations
Backend Runtime: Pyodide (WebAssembly Python 3 Runtime)
