import express from "express";
import dotenv from "dotenv";
import connectDatabase from "./config/MongoDb.js";
//import ImportData from "./DataImport.js";
//import productRoute from "./Routes/ProductRoutes.js";
import { errorHandler, notFound } from "./Middleware/Errors.js";
import userRouter from "./Routes/UserRoutes.js";
import Adsrouter from "./Routes/AdsRoutes.js";
import Roomrouter from "./Routes/Rooms.js";
import Messagerouter from "./Routes/Message.js";
import morgan from 'morgan';
import cors from 'cors'
import path from 'path'
import { Server } from 'socket.io'
import { createServer } from 'http';
import Message from './Models/Message.js'
import Util from './Models/Util.js'
import Ads from './Models/Ad.js'
import { log } from "console";
import nearbyCities from "nearby-cities"
import { protect, admin, header } from "./Middleware/AuthMiddleware.js";
//import Chat from './Models/Chats.js'
import { lookUp } from "geojson-places";
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'


const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 15 minutes
    limit: 5000, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // store: ... , // Use an external store for more precise rate limiting
})

// Apply the rate limiting middleware to all requests



connectDatabase();
const app = express();

app.use(limiter)
// app.use(helmet(
//     {
//         crossOriginEmbedderPolicy: false,
//         // ...
//     }
// ))
app.use(cors({
    origin: true
}))

const httpServer = createServer(app);


const io = new Server(httpServer, {
    allowEIO3: true,
    cors: {
        origin: true,
        methods: ['GET', 'POST'],
        credentials: true
    }
});
app.use(morgan('tiny'))


app.use(express.json());



// API
// app.use(express.static(path.join('D:', 'desta', 'server', 'images')));
app.use(express.static('images'))

app.get('/', header, protect, admin, (req, res) => { res.json(req.user) })

app.use("/api/users", userRouter);
app.use("/api/adds", Adsrouter);
app.use("/api/rooms", Roomrouter);
app.use("/api/messages", Messagerouter);
// ERROR HANDLER
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// io.use(async (socket, next) => {
//     try {
//         const token = socket.handshake.query.token;
//         const payload = await jwt.verify(token, process.env.SECRET);
//         socket.userId = payload.id;
//         next();
//     } catch (err) { }
// });

io.on("connection", (socket) => {
    console.log("Connected: " + socket.userId);

    socket.on("disconnect", () => {
        console.log("Disconnected: " + socket.userId);
    });

    socket.on("joinRoom", (roomid) => {
        socket.join(roomid);
        console.log("A user joined chatroom: " + roomid);
    });

    socket.on("leaveRoom", ({ roomid }) => {
        socket.leave(roomid);
        console.log("A user left chatroom: " + chatroomId);
    });

    socket.on("chatroomMessage", async ({ roomid, textmessage, userfrom, userto, }) => {
        if (textmessage.trim().length > 0) {
            //  const user = await User.findOne({ _id: socket.userId });
            const newMessage = new Message({
                userfrom,
                userto,
                roomid,
                textmessage,
                isseen:false
            });
            await newMessage.save().then(msg => {
                console.log('cln')
                msg.populate('userfrom').then(msgfinal => {
                    msgfinal.populate('userfrom').then(finalms => {
                        console.log('cleaning ')
                        io.to(roomid).emit("newMessage", finalms);
                        console.log(finalms);
                    })
                })
            })
            // message.populate('userfrom').populate('userto').then(msg => {
            //     console.log('cooling')
            // })


            // Message.populate(newMessage, { path: "userfrom" }, function (err, ms) {
            //     Message.populate(newMessage, { path: "userto" }, function (err, finalms) {
            //         io.to(roomid).emit("newMessage", finalms);
            //         console.log(finalms);
            //     })
            // })
            // newMessage.pop
        }
    });
});

// Reverse geocoding to get the adds[i].region info of Valladolid (Spain)
// const result = lookUp(14.105671, 38.284946).region_code;
// const result1 = lookUp(11.59364, 37.39077).region_code;
// const result2 = lookUp(10.06667, 34.53333).region_code;
// const result3 = lookUp(8.55, 39.26667).region_code;
// const result4 = lookUp(6.75, 38.41667).region_code;
// const result5 = lookUp(7.06205, 38.47635).region_code;
// const result6 = lookUp(8.25, 34.58333).region_code;
// console.log(result)
// console.log(result1)
// console.log(result2)
// console.log(result3)
// console.log(result4)
// console.log(result5)
// console.log(result6)

// const aksum = nearbyCities({ latitude: 14.12109, longitude: 38.72337 })
// const Mekele = nearbyCities({ latitude: 13.49667, longitude: 39.47528 })
// const Adwa = nearbyCities({ latitude: 14.190, longitude: 38.880 })
// const Adigrat = nearbyCities({ latitude: 14.2667, longitude: 39.4500 })
// const BahirDar = nearbyCities({ latitude: 11.6000, longitude: 37.3833 })
// const Gonder = nearbyCities({ latitude: 12.6075, longitude: 37.4592 })
// const Dessye = nearbyCities({ latitude: 11.13333, longitude: 39.63333 })
// const Kombolcha = nearbyCities({ latitude: 11.08155, longitude: 39.74339 })
// const DebreBirhan = nearbyCities({ latitude: 9.6833, longitude: 39.5333 })
// const Nazreth = nearbyCities({ latitude: 8.55, longitude: 39.26667 })
// const Jimma = nearbyCities({ latitude: 7.67344, longitude: 36.83441 })
// const Dilla = nearbyCities({ latitude: 6.41667, longitude: 38.31667 })
// const Shashamanni = nearbyCities({ latitude: 7.2, longitude: 38.6 })
// const Bishoftu = nearbyCities({ latitude: 8.75225, longitude: 38.97846 })
// const Hawassa = nearbyCities({ latitude: 7.06205, longitude: 38.47635 })
// const Arba = nearbyCities({ latitude: 6.03333, longitude: 37.55 })
// const Sodo = lookUp(6.8550, 37.7808).state_code;
// const Hosaina = nearbyCities({ latitude: 7.54978, longitude: 37.85374 })
// const Dila = nearbyCities({ latitude: 6.4083, longitude: 38.3083 })
// const Jijiga = nearbyCities({ latitude: 9.35, longitude: 42.8 })
// const Semera = nearbyCities({ latitude: 11.792794, longitude: 41.009148 })
// const Harar = nearbyCities({ latitude: 9.31387, longitude: 42.11815 })
// const Addis = nearbyCities({ latitude: 9.02497, longitude: 38.74689 })
// const Dire = nearbyCities({ latitude: 9.59306, longitude: 41.86611 })
// console.log(aksum[0].name)
// console.log(Mekele[0].name)
// console.log(Adwa[0].name)
// console.log(Adigrat[0].name)
// console.log(BahirDar[0].name)
// console.log(Gonder[0].name)
// console.log(Dessye[0].name)
// console.log(Kombolcha[0].name)
// console.log(DebreBirhan[0].name)
// console.log(Nazreth[0].name)
// console.log(Jimma[0].name)
// console.log(Dilla[0].name)
// console.log(Shashamanni[0].name)
// console.log(Bishoftu[0].name)
// console.log(Hawassa[0].name)
// console.log(Arba[0].name)
// console.log(Sodo[0].name)
// console.log(Hosaina[0].name)
// console.log(Dila[0].name)
// console.log(Jijiga[0].name)
// console.log(Semera[0].name)
// console.log(Harar[0].name)
// console.log(Addis[0].name)
// console.log(Dire[0].name)


httpServer.listen(PORT, console.log(`server run in port ${PORT}`));
