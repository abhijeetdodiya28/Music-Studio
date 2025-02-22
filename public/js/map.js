
const MAP_TOKEN = mapToken;// LocationIQ API token
document.addEventListener("DOMContentLoaded", async function () {
    // Ensure the data-coordinates attribute exists and is valid
    const listingCoordinates = JSON.parse(document.getElementById("map-data").dataset.coordinates);

    if (!listingCoordinates || listingCoordinates.length !== 2) {
        console.error("Invalid coordinates:", listingCoordinates);
        return;
    }

    // Initialize map
    const map = new maplibregl.Map({
        container: 'map',
        style: `https://maps.locationiq.com/v2/streets/vector.json?key=${MAP_TOKEN}`,
        center: listingCoordinates, // Set map center to the coordinates
        zoom: 14, // Adjust zoom level as needed
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Create popup
    const popup = new maplibregl.Popup({ offset: 25 })
        .setHTML(`<h4>Location</h4><p>Exact location provided after booking</p>`);

    // Add marker with the popup
    new maplibregl.Marker()
        .setLngLat(listingCoordinates)
        .setPopup(popup) // Attach popup to marker
        .addTo(map);

    // Open the popup by default
    popup.addTo(map);
});
