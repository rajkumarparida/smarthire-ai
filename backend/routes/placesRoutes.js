const express = require('express');
const router  = express.Router();

const GOOGLE_KEY = process.env.GOOGLE_PLACES_KEY;

// ── City search via Google Places ─────────────────────────────
router.get('/city', async (req, res) => {
  try {
    const { q } = req.query;
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
      `input=${encodeURIComponent(q)}&types=(cities)&key=${GOOGLE_KEY}`
    );
    const data = await response.json();
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS')
      return res.json([]);
    const results = (data.predictions || []).map(p => ({
      name:    p.structured_formatting?.main_text    || p.description,
      address: p.structured_formatting?.secondary_text || '',
    }));
    res.json(results);
  } catch (err) {
    res.status(500).json([]);
  }
});

// ── Reverse geocode via Google Geocoding API ──────────────────
router.get('/reverse', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?` +
      `latlng=${lat},${lon}&result_type=locality&key=${GOOGLE_KEY}`
    );
    const data = await response.json();
    const city = data.results?.[0]?.address_components
      ?.find(c => c.types.includes('locality'))?.long_name || '';
    res.json({ city });
  } catch (err) {
    res.status(500).json({ city: '' });
  }
});

// ── College search via Google Places ─────────────────────────
router.get('/college', async (req, res) => {
  try {
    const { q } = req.query;
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
      `input=${encodeURIComponent(q + ' college')}&` +
      `types=establishment&key=${GOOGLE_KEY}`
    );
    const data = await response.json();
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS')
      return res.json([]);
    const results = (data.predictions || []).map(p => ({
      name:     p.structured_formatting?.main_text     || p.description,
      address:  p.structured_formatting?.secondary_text || '',
      place_id: p.place_id,
    }));
    res.json(results);
  } catch (err) {
    res.status(500).json([]);
  }
});

// ── University search via Google Places ───────────────────────
router.get('/university', async (req, res) => {
  try {
    const { q } = req.query;
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
      `input=${encodeURIComponent(q + ' university')}&` +
      `types=establishment&key=${GOOGLE_KEY}`
    );
    const data = await response.json();
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS')
      return res.json([]);
    const results = (data.predictions || []).map(p => ({
      name:     p.structured_formatting?.main_text     || p.description,
      address:  p.structured_formatting?.secondary_text || '',
      place_id: p.place_id,
    }));
    res.json(results);
  } catch (err) {
    res.status(500).json([]);
  }
});

module.exports = router;