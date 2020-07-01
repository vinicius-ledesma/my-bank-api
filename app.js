const MongoClient = require("mongodb").MongoClient;
const uri = require("./environment").dbUri;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const collection = client.db("bank").collection("accounts");
  collection.find({}).toArray(function (err, result) {
    if (err) throw err;
    console.log(result);
    client.close();
  });
  // perform actions on the collection object
});
