/**
 * Shared location data for all mock data scripts.
 * Single source of truth — edit locations here only.
 */

const LOCATIONS = [
    { name: 'Sabarmati River', district: 'Ahmedabad', state: 'Gujarat', lat: 23.0209, lng: 72.5752 },
    { name: 'Kankaria Lake', district: 'Ahmedabad', state: 'Gujarat', lat: 22.9988, lng: 72.6047 },
    { name: 'Vastrapur Lake', district: 'Ahmedabad', state: 'Gujarat', lat: 23.0355, lng: 72.5246 },
    { name: 'Narmada River', district: 'Bharuch', state: 'Gujarat', lat: 21.7051, lng: 72.9959 },
    { name: 'Thol Lake', district: 'Mehsana', state: 'Gujarat', lat: 23.5832, lng: 72.4153 },
    { name: 'Dal Lake', district: 'Srinagar', state: 'Jammu and Kashmir', lat: 34.1100, lng: 74.8600 },
    { name: 'Hussain Sagar Lake', district: 'Hyderabad', state: 'Telangana', lat: 17.4239, lng: 78.4738 },
    { name: 'Powai Lake', district: 'Mumbai', state: 'Maharashtra', lat: 19.1233, lng: 72.9057 },
    { name: 'Chilika Lake', district: 'Puri', state: 'Odisha', lat: 19.7167, lng: 85.3167 },
    { name: 'Sukhna Lake', district: 'Chandigarh', state: 'Chandigarh', lat: 30.7420, lng: 76.8182 },
    { name: 'Upper Lake', district: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
    { name: 'Loktak Lake', district: 'Bishnupur', state: 'Manipur', lat: 24.5560, lng: 93.7980 },
    { name: 'Vembanad Lake', district: 'Alappuzha', state: 'Kerala', lat: 9.6200, lng: 76.4300 },
    { name: 'Fateh Sagar Lake', district: 'Udaipur', state: 'Rajasthan', lat: 24.5950, lng: 73.6780 },
    { name: 'Rabindra Sarovar', district: 'Kolkata', state: 'West Bengal', lat: 22.5146, lng: 88.3546 },
    { name: 'Osman Sagar Lake', district: 'Hyderabad', state: 'Telangana', lat: 17.3833, lng: 78.3100 },
    { name: 'Pulicat Lake', district: 'Tiruvallur', state: 'Tamil Nadu', lat: 13.4167, lng: 80.3167 },
    { name: 'Wular Lake', district: 'Bandipora', state: 'Jammu and Kashmir', lat: 34.3600, lng: 74.5900 },
    { name: 'Bhimtal Lake', district: 'Nainital', state: 'Uttarakhand', lat: 29.3467, lng: 79.5600 },
    { name: 'Kolleru Lake', district: 'West Godavari', state: 'Andhra Pradesh', lat: 16.6100, lng: 81.2000 },
    { name: 'East Kolkata Wetlands', district: 'South 24 Parganas', state: 'West Bengal', lat: 22.5167, lng: 88.4000 },
    { name: 'Periyar Lake', district: 'Idukki', state: 'Kerala', lat: 9.4750, lng: 77.1550 },
    { name: 'Mirik Lake', district: 'Darjeeling', state: 'West Bengal', lat: 26.8910, lng: 88.1850 }
];

/**
 * Get a random location from the list.
 */
function getRandomLocation() {
    return LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
}

/**
 * Add GPS variation so same-location entries don't stack on the map.
 * @param {number} lat  - base latitude
 * @param {number} lng  - base longitude
 * @param {number} radiusKm - max offset in km (default 3)
 */
function addGPSVariation(lat, lng, radiusKm = 3) {
    const latOffset = (Math.random() - 0.5) * 2 * (radiusKm / 111);
    const lngOffset = (Math.random() - 0.5) * 2 * (radiusKm / (111 * Math.cos(lat * Math.PI / 180)));
    return {
        lat: parseFloat((lat + latOffset).toFixed(6)),
        lng: parseFloat((lng + lngOffset).toFixed(6))
    };
}

/**
 * Get a random value between min and max with the given decimal precision.
 */
function getRandomValue(min, max, decimals = 1) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

module.exports = { LOCATIONS, getRandomLocation, addGPSVariation, getRandomValue };
