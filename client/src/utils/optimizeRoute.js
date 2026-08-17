import calculateDistance from "./distance";

function optimizeRoute(stops, depot) {
    if (stops.length === 0 || !depot) {
        return [];
    }

    const visited = new Set();
    const route = [];

    let currentPosition = depot;

    while (visited.size < stops.length) {
        let nearestStop = null;
        let minDistance = Infinity;

        for (const stop of stops) {
            if (visited.has(stop.id)) {
                continue;
            }

            const distance = calculateDistance(
                currentPosition,
                stop.position
            );

            if (distance < minDistance) {
                minDistance = distance;
                nearestStop = stop;
            }
        }

        visited.add(nearestStop.id);
        route.push(nearestStop);
        currentPosition = nearestStop.position;
    }

    route.unshift({
    id: "depot",
    name: "Depot",
    position: depot
});

route.push({
    id: "depot-end",
    name: "Depot",
    position: depot
});

    return route;
}

export default optimizeRoute;