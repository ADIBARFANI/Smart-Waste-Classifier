/**
 * classification.js – Waste classification logic
 * Uses Cloudflare Worker proxy (real AI) + mock fallback
 */

const WORKER_URL = 'https://smart-waste-ai.fm6506709.workers.dev/'; 

/* =====================================================
   MOCK DATABASE (fallback)
   ===================================================== */
const MOCK_DATABASE = [
  {
    result: {
      object_name: "Plastic Bottle",
      confidence: 92,
      category: "Plastic",
      bin_color: "Yellow",
      material: "PET plastic",
      is_recyclable: true,
      preparation_tips: [
        "Empty and rinse the bottle",
        "Remove the cap and label if possible",
        "Crush to save space"
      ],
      fun_fact: "It takes about 450 years for a PET bottle to decompose in nature.",
      recycling_ideas: [
        "Turn into a plant watering can by piercing small holes in the cap",
        "Cut the bottom to make a small storage container",
        "Use as a seed starter for gardening"
      ],
      safety_note: null
    }
  },
  {
    result: {
      object_name: "Aluminum Can",
      confidence: 94,
      category: "Metal",
      bin_color: "Yellow",
      material: "Aluminum",
      is_recyclable: true,
      preparation_tips: [
        "Empty completely",
        "Rinse if sticky",
        "Do not crush if your local facility prefers intact cans"
      ],
      fun_fact: "Recycling one aluminum can saves enough energy to power a TV for three hours.",
      recycling_ideas: [
        "Make pencil holders by decorating the outside",
        "Create wind chimes with several cans",
        "Use as planters for small herbs"
      ],
      safety_note: null
    }
  },
  {
    result: {
      object_name: "Cardboard Box",
      confidence: 90,
      category: "Paper & Cardboard",
      bin_color: "Blue",
      material: "Corrugated cardboard",
      is_recyclable: true,
      preparation_tips: [
        "Flatten the box",
        "Remove all tape and plastic packaging",
        "Keep dry and clean"
      ],
      fun_fact: "Cardboard can be recycled 5–7 times before the fibers become too short.",
      recycling_ideas: [
        "Build a cat house or play fort",
        "Create drawer organizers",
        "Use as weed barrier in the garden"
      ],
      safety_note: null
    }
  },
  {
    result: {
      object_name: "Food Scraps",
      confidence: 88,
      category: "Organic Waste",
      bin_color: "Green",
      material: "Organic matter",
      is_recyclable: true,
      preparation_tips: [
        "Remove any plastic packaging",
        "Keep free from meat if your compost is plant-only",
        "Drain excess liquid"
      ],
      fun_fact: "Food waste in landfills produces methane, a potent greenhouse gas.",
      recycling_ideas: [
        "Start a home compost bin",
        "Use coffee grounds as fertilizer",
        "Make banana peel fertilizer water"
      ],
      safety_note: null
    }
  },
  {
    result: {
      object_name: "Glass Jar",
      confidence: 91,
      category: "Glass",
      bin_color: "Yellow",
      material: "Glass",
      is_recyclable: true,
      preparation_tips: [
        "Rinse thoroughly",
        "Remove metal lids (recycle separately)",
        "Do not break the glass"
      ],
      fun_fact: "Glass can be recycled endlessly without loss of quality.",
      recycling_ideas: [
        "Reuse as storage for dry goods",
        "Turn into a candle holder",
        "Make a terrarium"
      ],
      safety_note: null
    }
  },
  {
    result: {
      object_name: "Battery",
      confidence: 95,
      category: "Hazardous Waste",
      bin_color: "Red",
      material: "Mixed metals & chemicals",
      is_recyclable: true,
      preparation_tips: [
        "Do not throw in regular trash",
        "Tape the terminals to prevent short circuits",
        "Take to a designated battery collection point"
      ],
      fun_fact: "One battery can contaminate 600,000 liters of water if disposed improperly.",
      recycling_ideas: [
        "Never attempt to open or upcycle batteries",
        "Store used batteries in a cool dry place until disposal",
        "Look for retailer take-back programs"
      ],
      safety_note: "Hazardous item. Never incinerate or puncture batteries."
    }
  },
  {
    result: {
      object_name: "Electronic Device",
      confidence: 87,
      category: "E-Waste",
      bin_color: "Red",
      material: "Mixed electronics",
      is_recyclable: true,
      preparation_tips: [
        "Remove personal data if possible",
        "Do not throw in regular bins",
        "Take to an e-waste collection center"
      ],
      fun_fact: "E-waste contains valuable metals like gold and rare earth elements.",
      recycling_ideas: [
        "Donate working devices if still functional",
        "Use official manufacturer take-back programs",
        "Never dismantle electronics at home"
      ],
      safety_note: "Contains potentially hazardous components. Use official recycling channels."
    }
  },
  {
    result: {
      object_name: "Cotton Fabric",
      confidence: 85,
      category: "Textile",
      bin_color: "Grey",
      material: "Cotton textile",
      is_recyclable: true,
      preparation_tips: [
        "Clean and dry the fabric",
        "Remove any non-textile parts if required",
        "Check local textile recycling options"
      ],
      fun_fact: "The fashion industry is responsible for about 10% of global carbon emissions.",
      recycling_ideas: [
        "Cut into cleaning rags",
        "Make reusable shopping bags",
        "Create patchwork projects or quilts"
      ],
      safety_note: null
    }
  }
];

/* =====================================================
   REAL AI via Cloudflare Worker
   ===================================================== */
async function classifyWithWorker(imageDataUrl) {
  if (!WORKER_URL || WORKER_URL.includes('YOUR-WORKER-NAME')) {
    throw new Error('Worker URL not configured');
  }

  const response = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageDataUrl })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || \`Worker error \${response.status}\`);
  }

  const result = await response.json();

  if (!result.object_name || !result.category) {
    throw new Error('Invalid response from worker');
  }

  result.confidence = Math.max(0, Math.min(100, parseInt(result.confidence) || 70));
  return result;
}

/* =====================================================
   MOCK CLASSIFICATION
   ===================================================== */
function classifyWithMock() {
  return new Promise((resolve) => {
    const delay = 1600 + Math.random() * 1000;
    setTimeout(() => {
      const selected = MOCK_DATABASE[Math.floor(Math.random() * MOCK_DATABASE.length)].result;
      const confidence = Math.max(45, Math.min(96, selected.confidence + Math.floor(Math.random() * 10) - 5));
      resolve({ ...selected, confidence });
    }, delay);
  });
}

/* =====================================================
   MAIN FUNCTION
   ===================================================== */
async function classifyWaste(imageDataUrl) {
  try {
    console.log('Using real AI via Worker…');
    return await classifyWithWorker(imageDataUrl);
  } catch (err) {
    console.warn('Real AI failed, falling back to mock:', err.message);
    return await classifyWithMock();
  }
}

/* =====================================================
   MANUAL RESULT (user correction)
   ===================================================== */
function createManualResult(category, binColor, note = '') {
  const materialMap = {
    'Organic Waste': 'Organic matter',
    'Paper & Cardboard': 'Paper / Cardboard',
    'Plastic': 'Plastic',
    'Glass': 'Glass',
    'Metal': 'Metal',
    'E-Waste': 'Electronic components',
    'Hazardous Waste': 'Hazardous material',
    'Textile': 'Textile',
    'Residual/Other': 'Mixed / Residual'
  };

  return {
    object_name: category,
    confidence: 100,
    category,
    bin_color: binColor,
    material: materialMap[category] || 'Unknown',
    is_recyclable: !['Hazardous Waste', 'Residual/Other'].includes(category),
    preparation_tips: [
      'Follow local sorting guidelines',
      'Keep items clean and dry when possible',
      'Separate different materials if mixed'
    ],
    fun_fact: 'Correct sorting greatly improves recycling rates and reduces contamination.',
    recycling_ideas: [
      'Check local upcycling workshops',
      'Look for community reuse programs',
      'When in doubt, place in residual bin'
    ],
    safety_note: category === 'Hazardous Waste'
      ? 'Hazardous item. Use designated collection points only.'
      : null,
    user_note: note || null
  };
}

function isRealAIConfigured() {
  return WORKER_URL && !WORKER_URL.includes('YOUR-WORKER-NAME');
}

window.classifyWaste = classifyWaste;
window.createManualResult = createManualResult;
window.isRealAIConfigured = isRealAIConfigured;
