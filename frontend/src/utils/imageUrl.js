export const API_ORIGIN =
  process.env.REACT_APP_API_ORIGIN ||
  process.env.REACT_APP_BACKEND_ORIGIN ||
  'http://localhost:5000';

export const getImageUrl = (img) => {
  if (!img) return null;
  if (img.startsWith('http')) return img;
  return `${API_ORIGIN}${img}`;
};
