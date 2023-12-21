import mongoose from 'mongoose'
const schema = mongoose.Schema({

    paymentenabled: {
        type: Boolean,
        default: false
    },
    payment: {
        type: String,
       
    },
    paymentforbigitems: {
        type: String,
    
    },

    chapaurl: {
        type: String,
    },



});


export default mongoose.model('Util', schema);
