const { MongoClient } = require('mongodb');
const data = require('./data.json');

async function createListing(client, newListing) {
    const result = await client.db("sample").collection("books").insertOne(newListing);
    console.log(`New listing created with the following id: ${result.insertedId}`);
    return result.insertedId;
}

async function updateListing(client, listingId, updatedListing) {
    const result = await client.db("sample").collection("books").updateOne({ _id: listingId }, { $set: updatedListing });

    console.log(`${result.matchedCount} document(s) matched the query criteria.`);
    console.log(`${result.modifiedCount} document(s) was/were updated.`);
}

async function deleteListing(client, listingId) {
    const result = await client.db("sample").collection("books").deleteOne({ _id: listingId });

    console.log(`${result.deletedCount} document(s) was/were deleted.`);
}

async function main() {
    const mongodbOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
    const uri = 'mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false';
    const client = new MongoClient(uri, mongodbOptions);
    try {
        await client.connect();
        const DavinciCode = await createListing(client, data[0]);
        const Alchemist = await createListing(client, data[1]);
        await updateListing(client, DavinciCode, { year: 2000 });
        await updateListing(client, Alchemist, { author: 'Paulo'});
        const SilentPatient = await createListing(client, data[2]);
        const DigitalFortress = await createListing(client, data[3]);
        await deleteListing(client, SilentPatient);
    } catch(e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

main().catch(console.error);