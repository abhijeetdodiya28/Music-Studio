const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listings.js");


const MONGO_URL = "mongodb://127.0.0.1:27017/Musicstudio";

main()
    .then(() => {
        console.log("Database connected");
    }).catch((err) => {
        console.log(err);
    })
async function main() {
    await mongoose.connect(MONGO_URL);
}

const initDb = async () => {
    await Listing.deleteMany({});
    const datawiter = initData.data.map((obj) => ({ ...obj, owner: "6790eac9ef724061dad09196" }))
    await Listing.insertMany(datawiter);
    console.log("Data was initialized");
}

initDb();