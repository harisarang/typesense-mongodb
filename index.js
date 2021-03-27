const { MongoClient } = require('mongodb');
const Typesense = require('typesense');

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

async function index(next, typesense){
    console.log(next);
    if(next.operationType == 'delete') {
        await typesense.collections('books').documents(next.documentKey._id).delete();
        console.log(next.documentKey._id);
    } else if(next.operationType == 'update') {
        let data = JSON.stringify(next.updateDescription.updatedFields);
        await typesense.collections('books').documents(next.documentKey._id).update(data);
        console.log(data);
    } else {
        next.fullDocument.id = next.fullDocument["_id"];
        delete next.fullDocument._id;
        let data = JSON.stringify(next.fullDocument);
        await typesense.collections('books').documents().upsert(data);
        console.log(data);
    }
}

async function monitorListingsUsingEventEmitter(client, typesense, timeInMs = 60000, pipeline = []){
    const collection = client.db("sample").collection("books");
    const changeStream = collection.watch(pipeline);
    changeStream.on('change', (next) => {
        index(next, typesense);
   });
   await closeChangeStream(timeInMs, changeStream);
}

async function createSchema(schema, typesense) {
    const collectionsList = await typesense.collections().retrieve();
    var toCreate = collectionsList.find((value, index, array) => {
        return value["name"] == schema["name"];
    });

    if(!toCreate){
        await typesense.collections().create(schema);
    }
}

async function main() {
    const typesense = new Typesense.Client({
        'nodes': [{
            'host': 'localhost',
            'port': '8108',
            'protocol': 'http'
        }],
        'apiKey': 'hari',
        'connectionTimeoutSeconds': 2
    });
    let schema = {
        'name': 'books',
        'fields': [
            {
                'name': 'id',
                'type': 'string',
                'facet': false
            },
            {
                'name': 'name',
                'type': 'string',
                'facet': false
            },
            {
                'name': 'author',
                'type': 'string',
                'facet': false
            },
            {
                'name': 'year',
                'type': 'int32',
                'facet': true
            },
        ],
        'default_sorting_field': 'year',
    }
    createSchema(schema, typesense);
    const mongodbOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
    const uri = 'mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false';
    const client = new MongoClient(uri, mongodbOptions);
    try {
        await client.connect();
        await listDatabases(client);
        await monitorListingsUsingEventEmitter(client, typesense);
    } catch(e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

main().catch(console.error);
