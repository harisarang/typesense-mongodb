const { MongoClient } = require('mongodb');

async function listDatabases(client){
    databasesList = await client.db().admin().listDatabases();
 
    console.log("Databases:");
    databasesList.databases.forEach(db => console.log(` - ${db.name}`));
};

function closeChangeStream(timeInMs = 60000, changeStream) {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log("Closing the change stream");
            changeStream.close();
            resolve();
        }, timeInMs)
    })
};

async function monitorListingsUsingEventEmitter(client, timeInMs = 60000, pipeline = []){
    const collection = client.db("sample").collection("books");
    const changeStream = collection.watch(pipeline);
    changeStream.on('change', (next) => {
        console.log(next);
   });
   await closeChangeStream(timeInMs, changeStream);
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
        await listDatabases(client);
        await monitorListingsUsingEventEmitter(client);
    } catch(e) {
        console.error(e);
    } finally {
        await client.close();
    }
}


main().catch(console.error);
