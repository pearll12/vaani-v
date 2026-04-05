/**
 * lib/geocoding.js
 * Utility to convert latitude and longitude into a readable address using Google Geocoding API.
 */

export async function getAddressFromCoords(lat, lng) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ GOOGLE_MAPS_API_KEY is not set. Reverse geocoding will be skipped.');
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      // Return the most detailed address
      return data.results[0].formatted_address;
    } else {
      console.error('❌ Google Geocoding failed:', data.status, data.error_message);
      return null;
    }
  } catch (err) {
    console.error('❌ Geocoding utility error:', err.message);
    return null;
  }
}
