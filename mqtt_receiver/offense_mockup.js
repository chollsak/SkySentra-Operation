const BASE_URL = 'http://localhost:3000';

const offenseCenter = { lat: 13.7563, lng: 100.5018 };
const offenseRadius = 0.002;
let offenseAngle = 0;

const ANGLE_INCREMENT = 0.3;

function getCirclePosition(center, radius, angle) {
  return {
    lat: center.lat + radius * Math.sin(angle),
    lng: center.lng + radius * Math.cos(angle),
  };
}

async function sendOffenseMove() {
  const pos = getCirclePosition(offenseCenter, offenseRadius, offenseAngle);

  const data = {
    codeName: 'DRONE-001',
    groupId: 1,
    type: 'drone',
    objective: 'surveillance',
    details: {
      color: 'blue',
      size: 1.5,
      speed: 25.0,
    },
    status: {
      'acc noising': false,
      'ang noising': false,
      'mag noising': false,
      'gps spoofing': false,
      target: 'zone-a',
      mission: 'recon',
    },
    location: {
      lat: pos.lat,
      lng: pos.lng,
      alt: 100,
    },
    position: {
      row: 0,
      pitch: 5,
      yaw: (offenseAngle * 180) / Math.PI,
    },
  };

  try {
    const res = await fetch(`${BASE_URL}/ttc/api/offense-move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    console.log('[Offense DRONE-001]', `lat: ${pos.lat.toFixed(6)}, lng: ${pos.lng.toFixed(6)}`, result.id ? '✓' : result);
  } catch (err) {
    console.error('[Offense Error]', err.message);
  }

  offenseAngle += ANGLE_INCREMENT;
}

const interval = setInterval(sendOffenseMove, 2000);

sendOffenseMove();

setTimeout(() => {
  clearInterval(interval);
  console.log('\n✓ Offense stopped after 12 seconds.');
  process.exit(0);
}, 12000);

console.log('Offense drone flying in circle... (will stop in 12 seconds)\n');