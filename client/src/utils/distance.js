
function calculateDistance(position1, position2) {
    const [lat1, lon1] = position1;
    const [lat2, lon2] = position2;

    //Degrees → Radians
    const toRadians = (degree) => degree * Math.PI / 180;

    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);

    const Δφ = toRadians(lat2 - lat1);
    const Δλ = toRadians(lon2 - lon1);

    // Haversine Formula
    const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) *
    Math.cos(φ2) *
    Math.sin(Δλ / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const R = 6371; // radius of earth in kilometers

    return R * c;
}
export default calculateDistance;