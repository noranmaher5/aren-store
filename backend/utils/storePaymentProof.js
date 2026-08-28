const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;

const hasCloudinary = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

const extensionFor = (mimetype = '') => {
  if (mimetype.includes('png')) return 'png';
  if (mimetype.includes('webp')) return 'webp';
  if (mimetype.includes('gif')) return 'gif';
  return 'jpg';
};

const storePaymentProof = async (file, req) => {
  if (!file?.buffer) return '';

  if (hasCloudinary()) {
    const uploaded = await cloudinary.uploader.upload(
      `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
      { folder: 'payment-proofs', resource_type: 'image' }
    );
    return uploaded.secure_url || uploaded.url || '';
  }

  const dir = path.join(__dirname, '..', 'uploads', 'payment-proofs');
  fs.mkdirSync(dir, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${extensionFor(file.mimetype)}`;
  fs.writeFileSync(path.join(dir, filename), file.buffer);
  return `${req.protocol}://${req.get('host')}/uploads/payment-proofs/${filename}`;
};

module.exports = { storePaymentProof };
