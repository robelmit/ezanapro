import express from 'express';
const router = express.Router();
import Message from '../Models/Message.js';
import Chat from '../Models/Rooms.js';
import { v4 as uuidv4 } from 'uuid';
import { protect, admin } from '../Middleware/AuthMiddleware.js'




router.get('/:roomid', protect, (req, res) => {

    Message.find({ roomid: req.params.roomid }
    ).populate('userfrom').populate('userto').
        then(message => {
            res.json(message)
        }).catch(err => {
            res.status(400).json('this is error');
        })
})
router.get('/my/getmessages', protect, (req, res) => {
    console.log('this is the messsages ')
    Message.find({ userto: req.user._id, isseen: false }
    ).populate('userfrom').populate('userto').sort({ _id: -1 }).
        then(message => {
            // console.log(message)
            res.json({ message: message.length })
        }).catch(err => {
            res.status(400).json('this is error');
        })
})
router.put('/:id', protect, async (req, res) => {
    // const user = await Message.findById({roomid:req.params.id});
    // user.balance += amount
    // const updateduser = await user.save();
    try {
        const messages = await Message.updateMany({ roomid: req.params.id, userto: req.user._id },
            { isseen: true });
        res.json(messages)
    }
    catch {
        console.log('error')
        res.status(400).json('this is error');

    }
    // Message.find({ userto: req.params.id ,isseen:false}
    // ).populate('userfrom').populate('userto').
    //     then(message => {
    //         res.json(message)
    //     }).catch(err => {
    //         res.status(400).json('this is error');
    //     })
})


router.post('/', protect, async (req, res) => {
    console.log('correct');
    const { userfrom, userto, roomid, textmessage } = req.body
    const msg = new Message({
        userfrom, userto, roomid, textmessage, isseen: false
    })
    console.log(msg);
    await msg.save()
    res.json(msg)
});

export default router;
