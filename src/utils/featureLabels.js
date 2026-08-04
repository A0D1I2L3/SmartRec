const labels = {
  rgb: 'RGB',
  backlit: 'Backlit keyboard',
  touchscreen: 'Touch screen',
  fingerprint: 'Fingerprint sensor',
  webcam: 'Webcam',
  dedicated_gpu: 'Dedicated GPU',
  high_refresh: 'High-refresh display',
  ssd: 'SSD',
  stylus: 'Stylus support',
  wifi6: 'Wi-Fi 6',
  thunderbolt: 'Thunderbolt',
}

export function featureLabel(key) {
  return labels[key] || key.replace(/[_-]+/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
}
