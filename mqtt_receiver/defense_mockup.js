const BASE_URL = 'http://localhost:3000';

const defenseCenter = { lat: 13.7600, lng: 100.5100 };
const defenseRadius = 0.0015;
let defense1Angle = 0;
let defense2Angle = Math.PI;

const ANGLE_INCREMENT = 0.3;

function getCirclePosition(center, radius, angle) {
  return {
    lat: center.lat + radius * Math.sin(angle),
    lng: center.lng + radius * Math.cos(angle),
  };
}

async function sendDefenseDetection(droneId, angle) {
  const pos = getCirclePosition(defenseCenter, defenseRadius, angle);

  const formData = new FormData();
  formData.append('objId', droneId);
  formData.append('type', 'drone');
  formData.append('lat', pos.lat.toString());
  formData.append('lng', pos.lng.toString());
  formData.append('alt', droneId === 'DRONE-1' ? '150' : '180');
  formData.append('groundHeight', '10');
  formData.append('objective', 'tracking');
  formData.append('size', 'medium');
  formData.append('details', JSON.stringify({
    color: droneId === 'DRONE-1' ? 'blue' : 'green',
    speed: 30,
  }));

  try {
    const res = await fetch(`${BASE_URL}/ttc/api/defense`, {
      method: 'POST',
      body: formData,
    });
    const result = await res.json();
    console.log(`[Defense ${droneId}]`, `lat: ${pos.lat.toFixed(6)}, lng: ${pos.lng.toFixed(6)}`, result.id ? '✓' : result);
  } catch (err) {
    console.error(`[Defense ${droneId} Error]`, err.message);
  }
}

async function sendAll() {
  await sendDefenseDetection('DRONE-1', defense1Angle);
  await sendDefenseDetection('DRONE-2', defense2Angle);

  defense1Angle += ANGLE_INCREMENT;
  defense2Angle += ANGLE_INCREMENT;
}

const interval = setInterval(sendAll, 2000);

sendAll();

setTimeout(() => {
  clearInterval(interval);
  console.log('\n✓ Defense stopped after 12 seconds.');
  process.exit(0);
}, 12000);

console.log('Defense drones flying in circle... (will stop in 12 seconds)\n');