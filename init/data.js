const samplelistings = [
  {
    name: "Awesome Sound Studio",
    location: "123 Music Lane, Melody City",
    facilities: ["Recording Booth", "Mixing Desk", "Instruments"],
    category: "General",
    availability: true,
    price: 5000,
    phoneNumber: "1234567890",
    images: [{ fileName: "awesome-sound-studio.jpg", url: "https://images.pexels.com/photos/164938/pexels-photo-164938.jpeg" }],
    geometry: { type: "Point", coordinates: [77.5946, 12.9716] }
  },
  {
    name: "Melody Makers Studio",
    location: "456 Harmony Street, Tune Town",
    facilities: ["Vocal Booth", "Analog Mixer", "Drum Kit"],
    category: "Percussion",
    availability: true,
    price: 5000,
    phoneNumber: "2345678901",
    images: [{ fileName: "melody-makers-studio.jpg", url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04" }],
    geometry: { type: "Point", coordinates: [78.4867, 17.3850] }
  },
  {
    name: "Beat Factory",
    location: "789 Rhythm Road, Music City",
    facilities: ["Digital Mixer", "Guitar Amplifiers", "Synthesizers"],
    category: "Keyboard",
    availability: false,
    price: 5000,
    phoneNumber: "3456789012",
    images: [{ fileName: "beat-factory.jpg", url: "https://5.imimg.com/data5/SELLER/Default/2022/11/UT/KK/BX/23607896/music-studio-designing-service.jpg" }],
    geometry: { type: "Point", coordinates: [72.8777, 19.0760] }
  },
  {
    name: "Harmony Haven",
    location: "321 Melody Way, Note Town",
    facilities: ["Soundproof Rooms", "High-End Microphones", "Editing Suite"],
    category: "Wind",
    availability: true,
    price: 5000,
    phoneNumber: "456789232",
    images: [{ fileName: "harmony-haven.jpg", url: "https://schoolofmusic.ucla.edu/app/uploads/2024/08/ucla-wadada-recording-session.jpg" }],
    geometry: { type: "Point", coordinates: [88.3639, 22.5726] }
  },
  // Add more than 20 objects following the same pattern
  {
    name: "Rhythm Studios",
    location: "654 Tempo Street, Beat City",
    facilities: ["Acoustic Treatment", "Multiple Recording Rooms", "Lounge Area"],
    category: "String",
    availability: true,
    price: 5000,
    phoneNumber: "5678901234",
    images: [{ fileName: "rhythm-studios.jpg", url: "https://5.imimg.com/data5/SELLER/Default/2022/11/GZ/HF/EK/23607896/music-studio-designing-service.jpg" }],
    geometry: { type: "Point", coordinates: [75.8577, 26.9124] }
  },
  // Additional listings
  {
    name: "Bassline Studio",
    location: "159 Drum Road, Rhythm City",
    facilities: ["Drum Kit", "Bass Amplifiers", "Digital Mixer"],
    category: "Brass",
    availability: false,
    price: 5000,
    phoneNumber: "7892123456",
    images: [{ fileName: "bassline-studio.jpg", url: "https://content.jdmagicbox.com/comp/service_catalogue/sound-recording-studios.jpg" }],
    geometry: { type: "Point", coordinates: [80.2785, 13.0827] }
  },
  {
    name: "Echo Chambers",
    location: "753 Reverb Street, Sound City",
    facilities: ["Reverb Units", "Soundproof Rooms", "Editing Suite"],
    category: "Ethnomusicology",
    availability: true,
    price: 5000,
    phoneNumber: "8901234567",
    images: [{ fileName: "echo-chambers.jpg", url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQN1" }],
    geometry: { type: "Point", coordinates: [72.5714, 23.0225] }
  }
];

module.exports = { data: samplelistings };
