let pyodideInstance = null;
let gardenGridState = {}; 
let harvestInventory = [];
let seedInventory = {}; 
let actionLogs = [];
let totalMutations = 0;
let selectedTileIndex = null;

// GRID DIMENSION SYSTEM (Default: 5x5 = 25 plots)
let gridRows = 5;
let gridCols = 5;

let gameState = {
  coins: 500,
  water: 200,
  activePets: [],       // Pwede nang maglaman ng multiple active pets
  petSlotsMax: 2        // Default maximum pet slots (upgradable)
};

// UNIVERSAL MYSTERY EGG HATCHERY STATE
let activeHatchery = null; // { key, progress, maxTime }

// RARITY DEFINITIONS WITH COLOR BADGES & MULTIPLIERS
const rarityDefs = {
  "Common": { color: "#9ca3af", badge: "⚪ Common", valMult: 1.0 },
  "Uncommon": { color: "#22c55e", badge: "🟢 Uncommon", valMult: 1.5 },
  "Rare": { color: "#3b82f6", badge: "🔵 Rare", valMult: 2.2 },
  "Epic": { color: "#a855f7", badge: "🟣 Epic", valMult: 3.5 },
  "Legendary": { color: "#eab308", badge: "🟡 Legendary", valMult: 5.5 },
  "Mythic": { color: "#ef4444", badge: "🔴 Mythic", valMult: 9.0 },
  "Prismatic": { color: "#ec4899", badge: "🌈 Prismatic", valMult: 15.0 },
  "Divine": { color: "#06b6d4", badge: "⚡ Divine", valMult: 25.0 }
};

// EXPANDED CROP DEFINITIONS
const cropDefs = {
  "Tomato": { emoji: "🍅", rarity: "Common", seedPrice: 10, baseVal: 15, baseKg: 0.8, growTime: 4 },
  "Carrot": { emoji: "🥕", rarity: "Common", seedPrice: 12, baseVal: 18, baseKg: 0.6, growTime: 5 },
  "Corn": { emoji: "🌽", rarity: "Uncommon", seedPrice: 20, baseVal: 35, baseKg: 1.5, growTime: 7 },
  "Rose": { emoji: "🌹", rarity: "Uncommon", seedPrice: 25, baseVal: 40, baseKg: 0.5, growTime: 8 },
  "Lavender": { emoji: "🪻", rarity: "Rare", seedPrice: 45, baseVal: 75, baseKg: 0.9, growTime: 10 },
  "Sunflower": { emoji: "🌻", rarity: "Rare", seedPrice: 50, baseVal: 85, baseKg: 2.1, growTime: 12 },
  "Cherry Blossom": { emoji: "🌸", rarity: "Epic", seedPrice: 90, baseVal: 160, baseKg: 1.3, growTime: 15 },
  "Cactus": { emoji: "🌵", rarity: "Epic", seedPrice: 110, baseVal: 190, baseKg: 3.2, growTime: 18 },
  "Golden Apple Tree": { emoji: "🍎", rarity: "Legendary", seedPrice: 200, baseVal: 400, baseKg: 4.0, growTime: 22 },
  "Orchid": { emoji: "🪷", rarity: "Legendary", seedPrice: 250, baseVal: 520, baseKg: 1.1, growTime: 25 },
  "Dragon Fruit": { emoji: "🐉", rarity: "Mythic", seedPrice: 500, baseVal: 1100, baseKg: 5.5, growTime: 30 },
  "Moonflower": { emoji: "🌙", rarity: "Mythic", seedPrice: 650, baseVal: 1450, baseKg: 2.0, growTime: 35 },
  "Rainbow Tree": { emoji: "🌳", rarity: "Prismatic", seedPrice: 1200, baseVal: 3000, baseKg: 8.0, growTime: 45 },
  "Crystal Rose": { emoji: "💎", rarity: "Prismatic", seedPrice: 1500, baseVal: 3800, baseKg: 3.5, growTime: 50 },
  "Yggdrasil Seedling": { emoji: "🌌", rarity: "Divine", seedPrice: 3500, baseVal: 9500, baseKg: 15.0, growTime: 65 },
  "Phoenix Fern": { emoji: "🔥", rarity: "Divine", seedPrice: 5000, baseVal: 14000, baseKg: 10.0, growTime: 80 }
};

const mutationTypes = [
  { prefix: "🥈 Silver", multiplier: 1.5 },
  { prefix: "✨ Golden", multiplier: 2.5 },
  { prefix: "🌈 Rainbow", multiplier: 4.0 }
];

const toolsDefs = {
  "fertilizer": { name: "🧪 Standard Fertilizer", price: 30, desc: "+1.5 kg & +25% Instant Growth" },
  "mutagen": { name: "🧬 Mutagen Serum", price: 150, desc: "Guarantees a random Mutation!" },
  "growth_accel": { name: "⚡ Growth Accelerator", price: 120, desc: "Instantly completes plant growth!" },
  "value_elixir": { name: "💎 Value Elixir", price: 200, desc: "Doubles (+100%) crop sale value!" },
  "shield": { name: "🛡️ Greenhouse Dome", price: 80, desc: "Protects tile against Climate Disasters" },
  "sprinkler": { name: "🌧️ Mega-Sprinkler", price: 150, desc: "Waters all grid plots instantly" }
};

const mysterySeeds = {
  "basic": { name: "📦 Basic Mystery Seed", price: 100, maxRarity: "Rare" },
  "advanced": { name: "🔮 Advanced Mystery Seed", price: 500, maxRarity: "Mythic" },
  "divine": { name: "🌌 Divine Cosmic Seed", price: 2500, maxRarity: "Divine" }
};

// PINALAWAK NA PET DEFINITIONS (Common hanggang Divine na may Mutation Buffs & Stackable Stats)
const petDefs = {
  "puppy": { name: "Crop Puppy", avatar: "🐶", rarity: "Common", price: 400, desc: "+10% Plant Growth Speed", stat: "+10% Speed" },
  "cat": { name: "Lucky Cat", avatar: "🐱", rarity: "Uncommon", price: 600, desc: "+15% Extra Coins on Harvest Sales", stat: "+15% Profit" },
  "bee": { name: "Mutation Bee", avatar: "🐝", rarity: "Rare", price: 800, desc: "+20% Chance for Mutation on Plant", stat: "+20% Mutate" },
  "owl": { name: "Wise Owl", avatar: "🦉", rarity: "Epic", price: 1200, desc: "Reduces seed store prices by 5%", stat: "-5% Cost" },
  "phoenix_chick": { name: "Phoenix Chick", avatar: "🐥", rarity: "Legendary", price: 3000, desc: "Auto-grows random crops over time", stat: "Auto-Grow" },
  "dragon_whelp": { name: "Dragon Whelp", avatar: "🐲", rarity: "Mythic", price: 6000, desc: "+50% Harvest Weight on crops", stat: "+50% Weight" },
  "celestial_fox": { name: "Celestial Fox", avatar: "🦊", rarity: "Prismatic", price: 15000, desc: "2x Final Sale Value multiplier", stat: "2x Sales" },
  "yggdrasil_spirit": { name: "Yggdrasil Spirit", avatar: "🧚", rarity: "Divine", price: 30000, desc: "Auto-waters + 35% Mutation Rate", stat: "Divine Aura" },
  "bot": { name: "Auto-Farm Bot", avatar: "🤖", rarity: "Epic", price: 1500, desc: "Auto-waters unwatered plots", stat: "Auto-Water" }
};

// UNIVERSAL MYSTERY EGG SYSTEM DEFINITIONS
const mysteryEggs = {
  "basic_egg": { name: "🥚 Basic Mystery Egg", price: 600, maxRarity: "Rare", hatchTime: 10 },
  "cosmic_egg": { name: "🌌 Cosmic Mystery Egg", price: 3000, maxRarity: "Divine", hatchTime: 25 }
};

const topicTemplates = {
  1: {
    title: "Topic 1: OOP & Dynamic Game State Engine",
    code: `import js\n\njs.updateGameState(500, 300)\njs.logAction("Python Engine: Added funds and replenished water!")\nprint("✅ Dynamic State Synced!")`
  },
  2: {
    title: "Topic 2: Queues & FIFO Climate Processing",
    code: `import js\n\njs.triggerClimateEvent()\nprint("✅ Climate Event Pushed to Queue!")`
  },
  3: {
    title: "Topic 3: 2D Grid Matrix Coordinates",
    code: `import js\n\njs.pythonPlantCrop(0, "Dragon Fruit", "✨ Golden")\njs.pythonPlantCrop(12, "Yggdrasil Seedling", "🌈 Rainbow")\nprint("✅ 2D Matrix Grid Populated from Python!")`
  },
  4: {
    title: "Topic 4: Tree Traversals (BFS Level-Order & DFS Pre/In/Post)",
    code: `import js\n\nclass PlantNode:\n    def __init__(self, name):\n        self.name = name\n        self.left = None\n        self.right = None\n\nroot = PlantNode("Garden Registry (Root)")\nroot.left = PlantNode("Uncommon: Corn")\nroot.right = PlantNode("Mythic: Dragon Fruit")\nroot.left.left = PlantNode("Common: Tomato")\n\ndef dfs_preorder(node):\n    if not node: return []\n    return [node.name] + dfs_preorder(node.left) + dfs_preorder(node.right)\n\ndef bfs_level_order(root):\n    if not root: return []\n    visited, queue = [], [root]\n    while queue:\n        current = queue.pop(0)\n        visited.append(current.name)\n        if current.left: queue.append(current.left)\n        if current.right: queue.append(current.right)\n    return visited\n\npre_result = dfs_preorder(root)\nbfs_result = bfs_level_order(root)\n\njs.logAction(f"DFS Preorder Tree Traversal: {pre_result}")\njs.logAction(f"BFS Level-Order Tree Traversal: {bfs_result}")\nprint(f"✅ Hierarchical Tree Traversal Successful!")`
  },
  5: {
    title: "Topic 5: Binary Search Trees & Soil Search",
    code: `import js\n\nclass BSTNode:\n    def __init__(self, val):\n        self.val = val\n        self.left = None\n        self.right = None\n\ndef insert(root, val):\n    if not root:\n        return BSTNode(val)\n    if val < root.val:\n        root.left = insert(root.left, val)\n    else:\n        root.right = insert(root.right, val)\n    return root\n\nsoil_levels = [6.5, 5.5, 7.0, 6.0, 6.8]\nroot = None\nfor ph in soil_levels:\n    root = insert(root, ph)\n\njs.logAction(f"BST Built for Soil pH levels. Root pH: {root.val}")\nprint("✅ Soil pH levels inserted into BST!")`
  },
  6: {
    title: "Topic 6: Heaps & Priority Queues (Market Pricing)",
    code: `import js\nimport heapq\n\nharvest_queue = []\nheapq.heappush(harvest_queue, (-14000, "Phoenix Fern"))\nheapq.heappush(harvest_queue, (-3000, "Rainbow Tree"))\nheapq.heappush(harvest_queue, (-400, "Golden Apple Tree"))\n\ntop_val, top_crop = heapq.heappop(harvest_queue)\njs.logAction(f"Max Heap Priority: Most valuable crop is {top_crop} ({abs(top_val)} Coins)")\nprint(f"✅ Priority Queue Processed! Top crop: {top_crop}")`
  },
  7: {
    title: "Topic 7: Hash Tables & Mutation Lookups",
    code: `import js\n\nmutation_table = {\n    "Silver": 1.5,\n    "Golden": 2.5,\n    "Rainbow": 4.0\n}\n\ncrop_key = "Rainbow"\nmultiplier = mutation_table.get(crop_key, 1.0)\njs.logAction(f"Hash Lookup: {crop_key} yields {multiplier}x value multiplier")\nprint(f"✅ Hash Table Key '{crop_key}' -> {multiplier}x Multiplier")`
  },
  8: {
    title: "Topic 8: Sorting Algorithms (Harvest Inventory)",
    code: `import js\n\ncrops = [\n    {"name": "Rose", "val": 40},\n    {"name": "Phoenix Fern", "val": 14000},\n    {"name": "Dragon Fruit", "val": 1100}\n]\n\nfor i in range(len(crops)):\n    for j in range(0, len(crops) - i - 1):\n        if crops[j]["val"] > crops[j+1]["val"]:\n            crops[j], crops[j+1] = crops[j+1], crops[j]\n\nsorted_names = [c["name"] for c in crops]\njs.logAction(f"Sorted Inventory: {', '.join(sorted_names)}")\nprint(f"✅ Bubble Sort Complete: {sorted_names}")`
  },
  9: {
    title: "Topic 9: Graph Algorithms & Irrigation Networks",
    code: `import js\n\nirrigation_graph = { 0: [1, 5], 1: [0, 2, 6], 2: [1, 3, 7], 5: [0, 6] }\n\ndef bfs_water_flow(start_node):\n    visited = []\n    queue = [start_node]\n    while queue:\n        node = queue.pop(0)\n        if node not in visited:\n            visited.append(node)\n            queue.extend(irrigation_graph.get(node, []))\n    return visited\n\nflow_path = bfs_water_flow(0)\njs.logAction(f"BFS Water Flow Pipeline: Connected Plots {flow_path}")\nprint(f"✅ BFS Graph Traversal Completed: {flow_path}")`
  },
  10: {
    title: "Topic 10: Dynamic Programming (Yield Optimization)",
    code: `import js\n\ndef max_crop_yield(water_capacity, water_costs, yields, n):\n    K = [[0 for x in range(water_capacity + 1)] for x in range(n + 1)]\n    for i in range(n + 1):\n        for w in range(water_capacity + 1):\n            if i == 0 or w == 0:\n                K[i][w] = 0\n            elif water_costs[i-1] <= w:\n                K[i][w] = max(yields[i-1] + K[i-1][w-water_costs[i-1]], K[i-1][w])\n            else:\n                K[i][w] = K[i-1][w]\n    return K[n][water_capacity]\n\nwater_costs = [10, 25, 50]\nyields = [100, 300, 800]\ncapacity = 60\nmax_val = max_crop_yield(capacity, water_costs, yields, len(yields))\njs.logAction(f"DP Knapsack Optimal Yield: {max_val}")\nprint(f"✅ Dynamic Programming Computed Yield: {max_val}")`
  }
};

// REALTIME TICK LOOP NA MAY STACKED PET BUFFS
setInterval(() => {
  let updated = false;

  const botCount = gameState.activePets.filter(p => p === "bot" || p === "yggdrasil_spirit").length;
  const puppyCount = gameState.activePets.filter(p => p === "puppy").length;

  // Auto-Farm Bot & Divine Spirit Waterer Stack
  if (botCount > 0) {
    Object.keys(gardenGridState).forEach(pos => {
      const tile = gardenGridState[pos];
      if (tile && !tile.watered) {
        tile.watered = true;
        tile.weight += (0.5 * botCount);
        updated = true;
      }
    });
  }

  // Growth Tick Calculation na may Stackable Puppy Speed Boost
  Object.keys(gardenGridState).forEach(pos => {
    const tile = gardenGridState[pos];
    if (tile && tile.growthProgress < 100) {
      let speedMult = tile.watered ? 2.0 : 1.0;
      if (puppyCount > 0) speedMult *= (1.0 + (0.10 * puppyCount));

      const def = cropDefs[tile.type];
      const increment = (100 / (def ? def.growTime : 10)) * speedMult;

      tile.growthProgress = Math.min(100, tile.growthProgress + increment);
      updated = true;
    }
  });

  if (updated) {
    renderUI();
    if (selectedTileIndex !== null) {
      inspectTile(selectedTileIndex);
    }
  }
}, 1000);

// BFS Level-Order Traversal para sa Mystery Seeds Rarity Scanning
function bfsMysterySearch(maxRank) {
  const rarityRanks = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic", "Prismatic", "Divine"];
  const maxIdx = rarityRanks.indexOf(maxRank);
  let queue = rarityRanks.slice(0, maxIdx + 1);
  let scannedTier = "Common";
  
  while (queue.length > 0) {
    let currentTier = queue.shift();
    if (Math.random() < 0.3 && queue.length > 0) {
      continue; 
    }
    scannedTier = currentTier;
    break;
  }
  return scannedTier;
}

// DFS Deep-Dive Traversal para sa pagpili ng partikular na Crop sa ilalim ng Rarity Tier
function dfsMysteryVault(targetRarity) {
  const eligibleCrops = Object.keys(cropDefs).filter(crop => cropDefs[crop].rarity === targetRarity);
  if (eligibleCrops.length > 0) {
    return eligibleCrops[Math.floor(Math.random() * eligibleCrops.length)];
  }
  return "Tomato";
}

function buyMysterySeed(tierKey) {
  const seedDef = mysterySeeds[tierKey];
  if (!seedDef) return;

  if (gameState.coins < seedDef.price) {
    logAction(`❌ Need ${seedDef.price} Coins to buy ${seedDef.name}!`);
    return;
  }

  gameState.coins -= seedDef.price;

  let winningRarity = bfsMysterySearch(seedDef.maxRarity);
  let rolledCrop = dfsMysteryVault(winningRarity);
  const cropData = cropDefs[rolledCrop];

  seedInventory[rolledCrop] = (seedInventory[rolledCrop] || 0) + 1;
  logAction(`🌳 BFS/DFS MYSTERY TRAVERSAL! Reached [${winningRarity}] ➔ Got ${cropData.emoji} ${rolledCrop} Seed!`);
  renderUI();
}

// --- SEED PACKS SYSTEM (BULK BUY x10) ---
function buySeedPack(cropType) {
  const def = cropDefs[cropType];
  if (!def) return;

  const quantity = 10;
  let owlCount = gameState.activePets.filter(p => p === "owl").length;
  let discount = 0.85 - (owlCount * 0.05); // 15% bulk discount + extra discount mula Wise Owl
  const totalPrice = Math.floor(def.seedPrice * quantity * Math.max(0.6, discount));

  if (gameState.coins < totalPrice) {
    logAction(`❌ Need ${totalPrice} Coins for 10x ${cropType} Seed Pack!`);
    return;
  }

  gameState.coins -= totalPrice;
  seedInventory[cropType] = (seedInventory[cropType] || 0) + quantity;
  logAction(`📦 Bought 10x ${def.emoji} ${cropType} Seed Pack for ${totalPrice} Coins!`);
  renderUI();
}

// --- UNIVERSAL EGG HATCHERY SYSTEM (BFS / DFS) ---
function bfsEggSearch(maxRank) {
  const rarityRanks = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic", "Prismatic", "Divine"];
  const maxIdx = rarityRanks.indexOf(maxRank);
  let queue = rarityRanks.slice(0, maxIdx + 1);
  let scannedTier = "Common";
  
  while (queue.length > 0) {
    let currentTier = queue.shift();
    if (Math.random() < 0.35 && queue.length > 0) {
      continue; 
    }
    scannedTier = currentTier;
    break;
  }
  return scannedTier;
}

function dfsEggVault(targetRarity) {
  const eligiblePets = Object.keys(petDefs).filter(pKey => petDefs[pKey].rarity === targetRarity);
  if (eligiblePets.length > 0) {
    return eligiblePets[Math.floor(Math.random() * eligiblePets.length)];
  }
  return "puppy";
}

function buyAndHatchEgg(eggKey) {
  const egg = mysteryEggs[eggKey];
  if (!egg) return;

  if (activeHatchery !== null) {
    logAction(`⚠️ An egg is already incubating in the hatchery!`);
    return;
  }

  if (gameState.coins < egg.price) {
    logAction(`❌ Need ${egg.price} Coins to buy ${egg.name}!`);
    return;
  }

  gameState.coins -= egg.price;
  activeHatchery = { key: eggKey, progress: 0, maxTime: egg.hatchTime };
  logAction(`incubating 🥚 ${egg.name} in Hatchery... (${egg.hatchTime}s)`);

  let hatchInterval = setInterval(() => {
    if (!activeHatchery) {
      clearInterval(hatchInterval);
      return;
    }
    activeHatchery.progress += (100 / egg.hatchTime);
    
    if (activeHatchery.progress >= 100) {
      clearInterval(hatchInterval);
      
      let winningRarity = bfsEggSearch(egg.maxRarity);
      let rewardedPetKey = dfsEggVault(winningRarity);
      let petInfo = petDefs[rewardedPetKey];

      if (gameState.activePets.length < gameState.petSlotsMax) {
        gameState.activePets.push(rewardedPetKey);
        logAction(`🎉 EGG HATCHED! Got [${winningRarity}] ${petInfo.avatar} ${petInfo.name} & equipped it!`);
      } else {
        logAction(`🎉 EGG HATCHED! Got [${winningRarity}] ${petInfo.avatar} ${petInfo.name} (Slots full, equip manually)!`);
      }
      
      activeHatchery = null;
    }
    renderUI();
  }, 1000);

  renderUI();
}

// --- UPGRADABLE PET SLOTS & STACKING MANAGEMENT ---
function upgradePetSlots() {
  const upgradeCost = gameState.petSlotsMax * 600;
  if (gameState.coins < upgradeCost) {
    logAction(`❌ Need ${upgradeCost} Coins to unlock a new Pet Slot!`);
    return;
  }

  gameState.coins -= upgradeCost;
  gameState.petSlotsMax += 1;
  logAction(`🔓 PET SLOT UPGRADED! You now have ${gameState.petSlotsMax} slots available.`);
  renderUI();
}

function equipPet(petKey) {
  if (gameState.activePets.length >= gameState.petSlotsMax) {
    logAction(`❌ All ${gameState.petSlotsMax} Pet Slots are full! Upgrade slots to equip more.`);
    return;
  }
  gameState.activePets.push(petKey);
  const pet = petDefs[petKey];
  const count = gameState.activePets.filter(p => p === petKey).length;
  logAction(`🐾 Stacked another ${pet.avatar} ${pet.name}! (Total Stack: x${count})`);
  renderUI();
}

function unequipPet(index) {
  const removed = gameState.activePets.splice(index, 1);
  if (removed.length > 0) {
    const pet = petDefs[removed[0]];
    logAction(`🐾 Unequipped ${pet.avatar} ${pet.name}.`);
  }
  renderUI();
}

function upgradeGridSize() {
  const upgradeCost = gridRows * gridCols * 15;
  if (gameState.coins < upgradeCost) {
    logAction(`❌ Cannot Expand Grid! Need ${upgradeCost} Coins.`);
    return;
  }

  gameState.coins -= upgradeCost;
  gridRows += 1;
  gridCols += 1;
  logAction(`🏗️ GRID EXPANDED! New Size: ${gridRows}x${gridCols} (${gridRows * gridCols} plots)`);
  renderUI();
}

function buyTool(toolKey) {
  const tool = toolsDefs[toolKey];
  if (gameState.coins < tool.price) {
    logAction(`❌ Need ${tool.price} Coins for ${tool.name}!`);
    return;
  }

  if (toolKey === "sprinkler") {
    gameState.coins -= tool.price;
    let count = 0;
    Object.keys(gardenGridState).forEach(pos => {
      if (gardenGridState[pos] && !gardenGridState[pos].watered) {
        gardenGridState[pos].watered = true;
        gardenGridState[pos].weight += 0.5;
        count++;
      }
    });
    logAction(`🌧️ Used Mega-Sprinkler! Watered ${count} plots.`);
  } else if (selectedTileIndex !== null && gardenGridState[selectedTileIndex]) {
    const tile = gardenGridState[selectedTileIndex];
    if (toolKey === "fertilizer") {
      gameState.coins -= tool.price;
      tile.weight += 1.5;
      tile.growthProgress = Math.min(100, tile.growthProgress + 25);
      logAction(`🧪 Applied Fertilizer to Tile #${selectedTileIndex} (+1.5kg, +25% Growth)`);
    } else if (toolKey === "mutagen") {
      gameState.coins -= tool.price;
      const mut = mutationTypes[Math.floor(Math.random() * mutationTypes.length)];
      tile.mutation = mut;
      totalMutations += 1;
      logAction(`🧬 Mutagen Applied! Plot #${selectedTileIndex} mutated into ${mut.prefix}!`);
    } else if (toolKey === "growth_accel") {
      gameState.coins -= tool.price;
      tile.growthProgress = 100;
      logAction(`⚡ Growth Accelerator used! Plot #${selectedTileIndex} is fully grown!`);
    } else if (toolKey === "value_elixir") {
      gameState.coins -= tool.price;
      tile.valueBonus = (tile.valueBonus || 1.0) * 2.0;
      logAction(`💎 Value Elixir Applied! Plot #${selectedTileIndex} sale value DOUBLED!`);
    } else if (toolKey === "shield") {
      gameState.coins -= tool.price;
      tile.shielded = true;
      logAction(`🛡️ Installed Greenhouse Dome on Tile #${selectedTileIndex}!`);
    }
  } else {
    logAction("⚠️ Select a planted tile on the grid first to apply this targeted tool!");
  }
  renderUI();
}

function handleTileClick(pos) {
  selectedTileIndex = pos;
  const cropType = document.getElementById("crop-selector").value;
  const tile = gardenGridState[pos];

  if (!tile) {
    if (!seedInventory[cropType] || seedInventory[cropType] <= 0) {
      logAction(`❌ No ${cropType} seeds left! Buy or roll Mystery Seeds/Packs.`);
      return;
    }
    seedInventory[cropType] -= 1;
    const def = cropDefs[cropType];

    let baseMutChance = 0.10;
    const beeCount = gameState.activePets.filter(p => p === "bee").length;
    const divineCount = gameState.activePets.filter(p => p === "yggdrasil_spirit").length;
    
    if (beeCount > 0) baseMutChance += (0.20 * beeCount);
    if (divineCount > 0) baseMutChance += (0.35 * divineCount);

    let initialMutation = null;
    if (Math.random() < baseMutChance) {
      initialMutation = mutationTypes[Math.floor(Math.random() * mutationTypes.length)];
      totalMutations += 1;
      logAction(`✨ LUCKY MUTATION! Planted ${initialMutation.prefix} ${cropType}!`);
    } else {
      logAction(`Planted ${def.emoji} ${cropType} [${def.rarity}] on Plot #${pos}`);
    }

    gardenGridState[pos] = { 
      type: cropType, 
      watered: false, 
      mutation: initialMutation, 
      weight: def.baseKg,
      growthProgress: 0,
      valueBonus: 1.0,
      shielded: false
    };
  } else if (!tile.watered) {
    if (gameState.water < 5) {
      logAction("❌ Out of Water!");
      return;
    }
    gameState.water -= 5;
    tile.watered = true;
    tile.weight += 0.8;
    logAction(`💧 Watered ${tile.type} on Plot #${pos} (2x Growth Boost)`);
  }

  renderUI();
  inspectTile(pos);
}

function inspectTile(pos) {
  const tile = gardenGridState[pos];
  const inspector = document.getElementById("inspector-body");
  if (!inspector) return;

  if (!tile) {
    inspector.innerHTML = `<p class="italic text-slate-400">Tile #${pos} is Empty. Select a seed to plant!</p>`;
    return;
  }

  const def = cropDefs[tile.type];
  const rarityInfo = rarityDefs[def.rarity] || rarityDefs["Common"];
  let mutationMultiplier = tile.mutation ? tile.mutation.multiplier : 1.0;
  let valBonus = tile.valueBonus || 1.0;

  let estimatedValue = Math.floor(def.baseVal * tile.weight * rarityInfo.valMult * mutationMultiplier * valBonus);
  const isReady = tile.growthProgress >= 100;

  inspector.innerHTML = `
    <div class="space-y-1.5">
      <div class="text-base font-bold text-white flex items-center justify-between">
        <span>${def.emoji} ${tile.type}</span>
        <span class="text-xs text-amber-300 font-mono">Plot #${pos}</span>
      </div>
      <div class="text-xs">
        <span class="px-2 py-0.5 rounded font-extrabold text-white text-[10px]" style="background-color: ${rarityInfo.color}">${rarityInfo.badge}</span>
      </div>
      <div class="text-emerald-400 font-semibold text-xs">Weight: ${tile.weight.toFixed(1)} KG</div>
      <div class="text-slate-300 text-xs">Growth: <span class="font-bold text-emerald-300">${Math.floor(tile.growthProgress)}% ${isReady ? '✅ Ready!' : '⏳ Growing...'}</span></div>
      <div class="text-slate-300 text-xs">Mutation: <span class="font-bold text-amber-300">${tile.mutation ? tile.mutation.prefix : 'Normal'}</span></div>
      <div class="text-slate-300 text-xs">Elixir Bonus: <span class="font-bold text-purple-300">${valBonus > 1.0 ? '💎 ' + valBonus + 'x' : 'None'}</span></div>
      <div class="text-slate-300 text-xs">Protection: <span class="font-bold text-blue-300">${tile.shielded ? '🛡️ Dome Installed' : 'None'}</span></div>
      <div class="text-yellow-300 font-extrabold text-sm pt-1 border-t border-emerald-800/40">Market Value: ${estimatedValue} Coins</div>
      <button onclick="harvestTile(${pos})" ${!isReady ? 'disabled' : ''} class="w-full mt-2 py-1.5 ${isReady ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-gray-700 cursor-not-allowed'} font-bold text-white rounded-lg text-xs">
        ${isReady ? '🌾 Harvest Plant' : '⏳ Waiting to Grow...'}
      </button>
    </div>
  `;
}

function harvestTile(pos) {
  const tile = gardenGridState[pos];
  if (!tile || tile.growthProgress < 100) {
    logAction("❌ Crop is not fully grown yet!");
    return;
  }

  const def = cropDefs[tile.type];
  const rarityInfo = rarityDefs[def.rarity] || rarityDefs["Common"];
  let mutationMultiplier = tile.mutation ? tile.mutation.multiplier : 1.0;
  let valBonus = tile.valueBonus || 1.0;

  let finalPrice = Math.floor(def.baseVal * tile.weight * rarityInfo.valMult * mutationMultiplier * valBonus);

  const catCount = gameState.activePets.filter(p => p === "cat").length;
  if (catCount > 0) {
    finalPrice = Math.floor(finalPrice * (1.0 + (0.15 * catCount)));
  }

  const foxCount = gameState.activePets.filter(p => p === "celestial_fox").length;
  if (foxCount > 0) {
    finalPrice = Math.floor(finalPrice * Math.pow(2.0, foxCount));
  }

  let fullName = tile.mutation ? `${tile.mutation.prefix} ${tile.type}` : tile.type;

  harvestInventory.push({ name: fullName, price: finalPrice, emoji: def.emoji, weight: tile.weight.toFixed(1), rarity: def.rarity });
  delete gardenGridState[pos];
  selectedTileIndex = null;

  logAction(`🌾 Harvested [${def.rarity}] ${fullName} (${tile.weight.toFixed(1)}kg) for ${finalPrice} Coins!`);
  renderUI();
}

function sellCrop(index) {
  const item = harvestInventory[index];
  if (!item) return;
  gameState.coins += item.price;
  logAction(`💰 Sold ${item.emoji} ${item.name} for +${item.price} Coins!`);
  harvestInventory.splice(index, 1);
  renderUI();
}

function pythonPlantCrop(pos, cropType, mutationName) {
  let mutation = null;
  if (mutationName && mutationName !== "Normal") {
    mutation = mutationTypes.find(m => m.prefix.includes(mutationName)) || mutationTypes[0];
    totalMutations += 1;
  }
  const def = cropDefs[cropType] || { baseKg: 1.0 };
  gardenGridState[pos] = { type: cropType, watered: true, mutation: mutation, weight: def.baseKg, growthProgress: 100, valueBonus: 1.0, shielded: false };
  renderUI();
}

function updateGameState(coins, water) {
  if (coins !== null && coins !== undefined) gameState.coins = coins;
  if (water !== null && water !== undefined) gameState.water = water;
  renderUI();
}

function logAction(msg) {
  actionLogs.push(msg);
  if (actionLogs.length > 10) actionLogs.shift();
  renderLogs();
}

function renderLogs() {
  const container = document.getElementById("action-stack");
  if (!container) return;
  container.innerHTML = "";
  [...actionLogs].reverse().forEach(log => {
    const div = document.createElement("div");
    div.className = "p-1.5 bg-[#212d1e] border border-emerald-800/60 rounded-lg text-[10px] text-emerald-200 font-mono";
    div.innerText = `➔ ${log}`;
    container.appendChild(div);
  });
}

// RENDER ACTIVE PET COMPANION SLOTS & HATCHERY UI
function renderPetCompanionUI() {
  const container = document.getElementById("pet-companion-container") || document.getElementById("pet-avatar")?.parentElement?.parentElement;
  if (!container) return;

  // I-update o i-render ang companion box gamit ang activePets slots
  const avatarElem = document.getElementById("pet-avatar");
  const nameElem = document.getElementById("pet-name");
  const badgeElem = document.getElementById("pet-status-badge");
  const descElem = document.getElementById("pet-buff-desc");
  const statElem = document.getElementById("pet-stat-value");

  if (avatarElem && nameElem) {
    if (gameState.activePets.length > 0) {
      let firstPetKey = gameState.activePets[0];
      let pet = petDefs[firstPetKey];
      avatarElem.innerHTML = `${pet.avatar} <span class="absolute -bottom-1 -right-1 flex h-2.5 w-2.5"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span></span>`;
      nameElem.innerText = `${pet.name} (${gameState.activePets.length}/${gameState.petSlotsMax} Slots)`;
      nameElem.className = "font-extrabold text-xs text-teal-200";
      badgeElem.innerText = `STACKED (x${gameState.activePets.filter(p => p === firstPetKey).length})`;
      badgeElem.className = "text-[9px] px-1.5 py-0.2 rounded font-bold bg-teal-900 text-teal-300 border border-teal-600/50";
      descElem.innerText = `Active Pets: ${gameState.activePets.map(p => petDefs[p].avatar).join(" ")}`;
      statElem.innerText = `Slots: ${gameState.activePets.length}/${gameState.petSlotsMax}`;
    } else {
      avatarElem.innerHTML = "🐾";
      nameElem.innerText = "No Pets Active";
      nameElem.className = "font-extrabold text-xs text-slate-400";
      badgeElem.innerText = "INACTIVE";
      badgeElem.className = "text-[9px] px-1.5 py-0.2 rounded font-bold bg-slate-800 text-slate-400";
      descElem.innerText = "Hatch or adopt companions from the shop!";
      statElem.innerText = `--`;
    }
  }
}

function renderMarketUI() {
  const marketList = document.getElementById("seed-market-list");
  const cropSelect = document.getElementById("crop-selector");
  if (!marketList || !cropSelect) return;

  marketList.innerHTML = "";
  cropSelect.innerHTML = "";

  Object.keys(cropDefs).forEach(key => {
    const item = cropDefs[key];
    const rarityInfo = rarityDefs[item.rarity] || rarityDefs["Common"];
    const ownedCount = seedInventory[key] || 0;

    const div = document.createElement("div");
    div.className = "flex items-center justify-between p-2 rounded-xl bg-[#1d271a] border border-emerald-800/40 mb-1";
    div.innerHTML = `
      <div>
        <div class="font-bold text-white flex items-center gap-1.5 text-xs">
          <span>${item.emoji} ${key}</span>
          <span class="text-[9px] px-1.5 py-0.5 rounded font-extrabold text-white" style="background-color: ${rarityInfo.color}">${rarityInfo.badge}</span>
        </div>
        <div class="text-[10px] text-amber-300">Price: ${item.seedPrice} | Stock: ${ownedCount}</div>
      </div>
      <div class="flex gap-1">
        <button onclick="buySeed('${key}')" class="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-[10px]">Buy</button>
        <button onclick="buySeedPack('${key}')" class="px-2 py-1 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-bold text-[10px]">Pack 10x</button>
      </div>
    `;
    marketList.appendChild(div);

    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = `${item.emoji} ${key} [${item.rarity}] (x${ownedCount})`;
    cropSelect.appendChild(opt);
  });

  const toolsList = document.getElementById("tools-shop-list");
  if (toolsList) {
    toolsList.innerHTML = "";

    // Mystery Seeds Rollers
    Object.keys(mysterySeeds).forEach(mKey => {
      const mDef = mysterySeeds[mKey];
      const div = document.createElement("div");
      div.className = "flex items-center justify-between p-2 rounded-xl bg-[#362719] border border-amber-800/60 mb-1.5";
      div.innerHTML = `
        <div>
          <div class="font-bold text-amber-200 text-xs">${mDef.name}</div>
          <div class="text-[10px] text-amber-300">${mDef.price} Coins | Up to ${mDef.maxRarity}</div>
        </div>
        <button onclick="buyMysterySeed('${mKey}')" class="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-[10px]">Roll 🎲</button>
      `;
      toolsList.appendChild(div);
    });

    // Universal Mystery Eggs Hatchery Shop
    Object.keys(mysteryEggs).forEach(eKey => {
      const eDef = mysteryEggs[eKey];
      const div = document.createElement("div");
      div.className = "flex items-center justify-between p-2 rounded-xl bg-[#2a1d3b] border border-purple-800/60 mb-1.5";
      div.innerHTML = `
        <div>
          <div class="font-bold text-purple-200 text-xs">${eDef.name}</div>
          <div class="text-[10px] text-purple-300">${eDef.price} Coins | Max: ${eDef.maxRarity} (${eDef.hatchTime}s)</div>
        </div>
        <button onclick="buyAndHatchEgg('${eKey}')" class="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-[10px]">Hatch 🥚</button>
      `;
      toolsList.appendChild(div);
    });

    // Pet Slot Upgrade Button
    const slotCost = gameState.petSlotsMax * 600;
    const slotDiv = document.createElement("div");
    slotDiv.className = "flex items-center justify-between p-2 rounded-xl bg-[#13332a] border border-teal-600/60 mb-1.5";
    slotDiv.innerHTML = `
      <div>
        <div class="font-bold text-teal-200 text-xs">🔓 Unlock Pet Slot (${gameState.activePets.length}/${gameState.petSlotsMax})</div>
        <div class="text-[10px] text-teal-300">Cost: ${slotCost} Coins</div>
      </div>
      <button onclick="upgradePetSlots()" class="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold text-[10px]">Unlock</button>
    `;
    toolsList.appendChild(slotDiv);

    // Active Pets list manager (Equipped pets and unequip)
    if (gameState.activePets.length > 0) {
      const activePetsDiv = document.createElement("div");
      activePetsDiv.className = "p-2 rounded-xl bg-[#1d332d] border border-teal-800/60 mb-1.5 space-y-1";
      let petsHtml = `<div class="font-bold text-teal-200 text-xs mb-1">🐾 Active Pets Stack:</div>`;
      gameState.activePets.forEach((pKey, idx) => {
        const pDef = petDefs[pKey];
        petsHtml += `
          <div class="flex items-center justify-between text-[10px] bg-teal-950/60 p-1 rounded">
            <span>${pDef.avatar} ${pDef.name}</span>
            <button onclick="unequipPet(${idx})" class="px-1.5 py-0.5 bg-red-800 hover:bg-red-700 text-white rounded">X</button>
          </div>
        `;
      });
      activePetsDiv.innerHTML = petsHtml;
      toolsList.appendChild(activePetsDiv);
    }

    // Standard Tools List
    Object.keys(toolsDefs).forEach(key => {
      const tool = toolsDefs[key];
      const div = document.createElement("div");
      div.className = "flex items-center justify-between p-2 rounded-xl bg-[#1d271a] border border-blue-800/40 mb-1.5";
      div.innerHTML = `
        <div>
          <div class="font-bold text-white text-xs">${tool.name}</div>
          <div class="text-[10px] text-blue-300">${tool.price} Coins | ${tool.desc}</div>
        </div>
        <button onclick="buyTool('${key}')" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-[10px]">Buy</button>
      `;
      toolsList.appendChild(div);
    });

    // Pet Direct Shop List
    Object.keys(petDefs).forEach(pKey => {
      const pDef = petDefs[pKey];
      const div = document.createElement("div");
      div.className = "flex items-center justify-between p-2 rounded-xl bg-[#1d332d] border border-teal-800/60 mb-1.5";
      div.innerHTML = `
        <div>
          <div class="font-bold text-teal-200 text-xs">${pDef.avatar} ${pDef.name}</div>
          <div class="text-[10px] text-teal-300">${pDef.price} Coins | ${pDef.desc}</div>
        </div>
        <button onclick="equipPet('${pKey}')" class="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold text-[10px]">Equip</button>
      `;
      toolsList.appendChild(div);
    });

    const expandCost = gridRows * gridCols * 15;
    const expandDiv = document.createElement("div");
    expandDiv.className = "flex items-center justify-between p-2 rounded-xl bg-[#2a1d3b] border border-purple-800/60";
    expandDiv.innerHTML = `
      <div>
        <div class="font-bold text-purple-200 text-xs">📐 Expand Grid (${gridRows}x${gridCols})</div>
        <div class="text-[10px] text-purple-300">Cost: ${expandCost} Coins</div>
      </div>
      <button onclick="upgradeGridSize()" class="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-[10px]">Expand</button>
    `;
    toolsList.appendChild(expandDiv);
  }
}

function buySeed(cropType) {
  const def = cropDefs[cropType];
  if (!def) return;

  let owlCount = gameState.activePets.filter(p => p === "owl").length;
  let finalPrice = Math.floor(def.seedPrice * (1.0 - (0.05 * owlCount)));

  if (gameState.coins < finalPrice) {
    logAction(`❌ Cannot buy ${cropType}: Need ${finalPrice} Coins!`);
    return;
  }
  gameState.coins -= finalPrice;
  logAction(`🛍️ Bought ${def.emoji} ${cropType} Seed (-${finalPrice} Coins)`);

  seedInventory[cropType] = (seedInventory[cropType] || 0) + 1;
  renderUI();
}

function renderUI() {
  const coinsElem = document.getElementById("coins-display");
  const mutElem = document.getElementById("mutation-count");
  const waterTxt = document.getElementById("water-text");
  const waterBar = document.getElementById("water-bar");

  if (coinsElem) coinsElem.innerText = `💰 ${gameState.coins}`;
  if (mutElem) mutElem.innerText = `✨ ${totalMutations}`;
  if (waterTxt) waterTxt.innerText = `${gameState.water}/200 L`;
  if (waterBar) waterBar.style.width = `${Math.min(100, (gameState.water / 200) * 100)}%`;

  renderPetCompanionUI();
  renderMarketUI();

  // DYNAMIC GRID RENDER WITH PET OVERLAYS
  const grid = document.getElementById("garden-grid");
  if (grid) {
    grid.style.gridTemplateColumns = `repeat(${gridCols}, minmax(0, 1fr))`;
    grid.innerHTML = "";

    const totalTiles = gridRows * gridCols;
    for (let i = 0; i < totalTiles; i++) {
      const tile = gardenGridState[i];
      const cell = document.createElement("div");
      cell.onclick = () => handleTileClick(i);

      if (tile) {
        const def = cropDefs[tile.type];
        const rarityInfo = rarityDefs[def ? def.rarity : "Common"];
        const isMutated = tile.mutation !== null;
        const isReady = tile.growthProgress >= 100;

        let petOverlay = "";
        const botCount = gameState.activePets.filter(p => p === "bot" || p === "yggdrasil_spirit").length;
        if (botCount > 0 && !tile.watered) {
          petOverlay = `<span class="absolute top-1 right-1 text-[10px] animate-bounce">🤖</span>`;
        }

        let styleClass = isMutated ? 'bg-amber-950/80 border-amber-400' : tile.watered ? 'bg-emerald-900 border-blue-400' : 'bg-[#283623] border-emerald-700';

        cell.className = `aspect-square ${styleClass} rounded-xl flex flex-col items-center justify-center text-lg border cursor-pointer transition relative overflow-hidden`;

        cell.innerHTML = `
          <span>${isReady ? (def ? def.emoji : '🌱') : '🌱'}</span>
          <span class="text-[8px] font-bold ${isMutated ? 'text-amber-300' : 'text-emerald-300'}">${Math.floor(tile.growthProgress)}%</span>
          ${petOverlay}
          <div class="absolute top-0 left-0 right-0 h-1" style="background-color: ${rarityInfo.color}"></div>
          <div class="absolute bottom-0 left-0 h-1 bg-emerald-400 transition-all duration-300" style="width: ${tile.growthProgress}%"></div>
        `;
      } else {
        cell.className = "aspect-square bg-[#131a12] hover:bg-[#212d1e] rounded-xl flex items-center justify-center text-[10px] text-slate-600 border border-emerald-900/40 cursor-pointer transition";
        cell.innerText = `${i}`;
      }
      grid.appendChild(cell);
    }
  }

  // Harvest Inventory Render
  const invContainer = document.getElementById("harvest-inventory");
  if (invContainer) {
    invContainer.innerHTML = "";
    if (!harvestInventory.length) {
      invContainer.innerHTML = "<p class='text-[11px] text-slate-500'>No harvested crops yet.</p>";
    } else {
      harvestInventory.forEach((item, idx) => {
        const rarityInfo = rarityDefs[item.rarity] || rarityDefs["Common"];
        const div = document.createElement("div");
        div.className = "flex items-center justify-between p-2 rounded-xl bg-[#1d271a] border border-emerald-800/40 mb-1";
        div.innerHTML = `
          <div>
            <div class="font-bold text-white text-xs flex items-center gap-1">
              <span>${item.emoji} ${item.name} (${item.weight}kg)</span>
              <span class="text-[8px] px-1 rounded text-white" style="background-color: ${rarityInfo.color}">${item.rarity}</span>
            </div>
            <div class="text-[10px] text-yellow-300">+${item.price} Coins</div>
          </div>
          <button onclick="sellCrop(${idx})" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] rounded-lg font-bold">Sell</button>
        `;
        invContainer.appendChild(div);
      });
    }
  }
}

function populateTopicDropdown() {
  const select = document.getElementById("topic-selector");
  if (!select) return;
  select.innerHTML = "";
  Object.keys(topicTemplates).forEach(key => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = topicTemplates[key].title;
    select.appendChild(opt);
  });
}

function loadTopic() {
  const select = document.getElementById("topic-selector");
  if (!select) return;
  const val = select.value;
  if (topicTemplates[val]) {
    document.getElementById("code-editor").value = topicTemplates[val].code;
  }
}

function switchTab(tab) {
  const gameView = document.getElementById("view-game");
  const codeView = document.getElementById("view-code");
  const tabGame = document.getElementById("tab-game");
  const tabCode = document.getElementById("tab-code");

  if (tab === 'game') {
    gameView.classList.remove("hidden");
    codeView.classList.add("hidden");
    tabGame.className = "px-4 py-1.5 rounded-lg text-xs font-bold bg-[#283623] text-emerald-100";
    tabCode.className = "px-4 py-1.5 rounded-lg text-xs font-bold text-emerald-400/80 hover:text-emerald-100";
  } else {
    gameView.classList.add("hidden");
    codeView.classList.remove("hidden");
    codeView.classList.add("flex");
    tabCode.className = "px-4 py-1.5 rounded-lg text-xs font-bold bg-[#283623] text-emerald-100";
    tabGame.className = "px-4 py-1.5 rounded-lg text-xs font-bold text-emerald-400/80 hover:text-emerald-100";
  }
}

async function initPyodide() {
  const consoleDiv = document.getElementById("output-console");
  if (consoleDiv) consoleDiv.innerText = "⏳ Loading Pyodide Engine...";
  try {
    pyodideInstance = await loadPyodide();
    if (consoleDiv) consoleDiv.innerText = "✅ Pyodide Ready! Select a topic and click Run.";
    populateTopicDropdown();
    loadTopic();
    renderUI();
  } catch (err) {
    if (consoleDiv) consoleDiv.innerText = "❌ Failed to load Pyodide: " + err;
  }
}

async function runPythonCode() {
  const consoleDiv = document.getElementById("output-console");
  const code = document.getElementById("code-editor").value;

  if (!pyodideInstance) {
    if (consoleDiv) consoleDiv.innerText = "❌ Pyodide is not loaded yet.";
    return;
  }

  if (consoleDiv) consoleDiv.innerText = "⚙️ Executing Python Script...\n";
  try {
    pyodideInstance.setStdout({
      batched: (str) => {
        if (consoleDiv) consoleDiv.innerText += str + "\n";
      }
    });

    await pyodideInstance.runPythonAsync(code);
  } catch (err) {
    if (consoleDiv) consoleDiv.innerText += "❌ Error:\n" + err;
  }
}

window.onload = () => {
  initPyodide();
};
