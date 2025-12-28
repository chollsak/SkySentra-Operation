// index.js
const BASE_URL = 'http://localhost:3000';

// Offense Drone - บินวนเป็นวงกลม
const offenseCenter = { lat: 13.7563, lng: 100.5018 };
const offenseRadius = 0.002; // รัศมีวงกลม
let offenseAngle = 0;

// Defense Drones - บินวนเป็นวงกลมคนละทิศ
const defenseCenter = { lat: 13.7600, lng: 100.5100 };
const defenseRadius = 0.0015;
let defense1Angle = 0;
let defense2Angle = Math.PI; // เริ่มคนละฝั่ง (180 องศา)

const ANGLE_INCREMENT = 0.3; // ความเร็วในการหมุน (radian)

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
      color: 'red',
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
      yaw: (offenseAngle * 180) / Math.PI, // แปลงเป็น degree
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
    speed: 30 
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
  await sendOffenseMove();
  await sendDefenseDetection('DRONE-1', defense1Angle);
  await sendDefenseDetection('DRONE-2', defense2Angle);
  
  defense1Angle += ANGLE_INCREMENT;
  defense2Angle += ANGLE_INCREMENT;
}

const interval = setInterval(sendAll, 2000);

sendAll();

setTimeout(() => {
  clearInterval(interval);
  console.log('\n✓ Stopped after 12 seconds.');
  process.exit(0);
}, 12000);

console.log('Started sending data... (3 drones flying in circles, will stop in 12 seconds)\n');