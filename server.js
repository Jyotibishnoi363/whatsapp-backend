//imports
import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from 'pusher';
import cors from 'cors';

//app config
const app = express();
const port = process.env.PORT || 9001;

const pusher = new Pusher({
    appId: "1230985",
    key: "9be8967a90bb2deacd1e",
    secret: "3e61853aa0fd33b05431",
    cluster: "ap2",
    useTLS: true
  });

//middleware
app.use(express.json());
app.use(cors());
// app.use((req, res, next ) => {
//     res.setHeader("Access-Control-Allow-Origin", "*");
//     res.setHeader("Access-Control-Allow-Headers", "*");
//     next();
// })

//DB config
const connection_url = 'mongodb+srv://admin:Unknownme@29@cluster0.2wuxf.mongodb.net/whatsappDb?retryWrites=true&w=majority'
mongoose.connect(connection_url, { 
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true});

const db = mongoose.connection;

db.once('open', () => {
    console.log("DB is connected");

    const msgCollection = db.collection('messagecontents');
    const changeStream = msgCollection.watch(); 

    changeStream.on('change', (change) => {
      console.log('A change occured', change);
      if(change.operationType == "insert") {
          const messageDetails = change.fullDocument;
          pusher.trigger("messages", "inserted", {
              name: messageDetails.name,
              message: messageDetails.message,
              timestamp: messageDetails.timestamp,
              received: messageDetails.received
          })
      }else 
      {
          console.log("Error triggering pusher")
      }
    })

  
})
//????

//api routes
app.get('/', (req, res) => res.status(200).send("Hello world"));

app.get('/api/v1/messages/sync', (req, res) => {

    Messages.find((err, data)=> {
        if(err) {
            res.status(500).send(err);
        }else {
            res.status(200).send(data);
        }
    })

})

app.post('/api/v1/messages/new', (req, res) => {
    const dbMessage = req.body; 

    Messages.create(dbMessage, (err, data)=> {
        if(err) {
            res.status(500).send(err);
        }else {
            res.status(201).send(data);
        }
    })

})

//listener
app.listen(port, ()=> console.log(`Listening on localhost:${port}`));