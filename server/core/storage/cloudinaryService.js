const { v2: cloudinary } = require('cloudinary');
const crypto = require('crypto');
const config = require('../../config/env');

function isConfigured() {
  return Boolean(config.CLOUDINARY_CLOUD_NAME && config.CLOUDINARY_API_KEY && config.CLOUDINARY_API_SECRET);
}

if (isConfigured()) {
  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

function isDataImage(value) {
  return /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(String(value || ''));
}

async function uploadEvidenceImages(images = [], complaintId = 'unassigned') {
  if (!Array.isArray(images)) return [];
  const selected = images.slice(0, 3).map((image) => typeof image === 'string' ? { url: image } : image).filter(Boolean);
  const output = [];

  for (const image of selected) {
    const url = String(image.url || '');
    if (!url) continue;
    if (!isDataImage(url)) {
      if (/^https:\/\//i.test(url) && url.length <= 700000) output.push({ ...image, url });
      continue;
    }
    if (!isConfigured()) {
      output.push({ ...image, url });
      continue;
    }
    const result = await cloudinary.uploader.upload(url, {
      folder: 'campusfix/reports',
      public_id: `report-${complaintId}-${crypto.randomUUID()}-${output.length + 1}`,
      overwrite: false,
      resource_type: 'image',
    });
    output.push({ ...image, url: result.secure_url, publicId: result.public_id, storage: 'cloudinary' });
  }
  return output;
}

module.exports = { isConfigured, uploadEvidenceImages };
