import express from "express";
import asyncHandler from "express-async-handler";
import { protect, admin } from "../Middleware/AuthMiddleware.js";
import generateToken from "../utils/generateToken.js";
import User from "./../Models/User.js";
import Util from "./../Models/Util.js";
import Add from "./../Models/Ad.js";
import Room from "./../Models/Rooms.js";
import Message from "./../Models/Message.js";
import nearbyCities from "nearby-cities"
import bcrypt from 'bcryptjs'


const userRouter = express.Router();

// LOGIN
userRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { phoneNumber, password } = req.body;
    const user = await User.findOne({ phoneNumber });
    console.log(user)
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        phoneNumber: user.phoneNumber,
        token: generateToken(user._id),
        createdAt: user.createdAt,
      });
    } else {
      res.status(401);
      throw new Error("Invalid Email or Password");
    }
  })
);

// REGISTER
userRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, phoneNumber, email, password } = req.body;
    console.log(req.body);
    console.log(phoneNumber);
    console.log(email);
    console.log(password);

    const userExists = await User.findOne({ phoneNumber });

    if (userExists) {
      res.status(400);
      throw new Error("User already exists");
    }
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashed,
      phoneNumber
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error("Invalid User Data");
    }
  })
);

// PROFILE
userRouter.get(
  "/profile",
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
      });
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  })
);
userRouter.get(
  "/user/:id",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        phoneNumber: user.phoneNumber,
      });
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  })
);
userRouter.delete(
  "/user/:id",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);

    if (user) {
      res.json({
        message: "User Successfully deleted"
      });
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  })
);

// UPDATE PROFILE
userRouter.put(
  "/profile",
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      if (req.body.password) {
        user.password = req.body.password;
      }
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        createdAt: updatedUser.createdAt,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  })
);

// GET ALL USER ADMIN
userRouter.get(
  "/oll",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;
    console.log(req.query.keyword);
    const keyword = req.query.keyword
      ? {
        name: {
          $regex: req.query.keyword,
          $options: "i",
        },
      }
      : {};

    const count = await User.countDocuments({ ...keyword });
    const users = await User.find({ ...keyword })
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ _id: -1 });
    res.json({ users, page, pages: Math.ceil(count / pageSize) });
  })
);

userRouter.delete('/favourites',
  protect,
  async (req, res) => {
    console.log('requesting');

    let { favourite } = req.body
    var user = await User.findOne({ _id: req.user._id });
    console.log(user);

    if (user.favourites.includes(favourite)) {
      const user = await User.findByIdAndUpdate({ _id: req.user._id }, {
        $pull: {
          favourites: favourite,

        }
      })

      res.json(

        user.favourites
      );
    }
    else {
      res.status(401);
    }

  })
userRouter.post('/favourites',
  protect,
  async (req, res) => {
    //     var John = people.findOne({name: "John"});
    // John.friends.push({firstName: "Harry", lastName: "Potter"});
    // John.save();
    let { favourite } = req.body
    var user = await User.findOne({ _id: req.user });
    console.log(user);
    // console.log(user.favourites);
    var fav = [];// = user.favourites;
    fav.includes
    if (user.favourites.includes(favourite)) {
      res.status(401);
    }
    else {
      user.favourites.push(favourite)
      user.save()
      res.json(

        user.favourites
      );
    }

  })
userRouter.post('/location',
  protect,
  async (req, res) => {
    //     var John = people.findOne({name: "John"});
    // John.friends.push({firstName: "Harry", lastName: "Potter"});
    // John.save();
    let { latitude, longitude } = req.body
    var user = await User.findOne({ _id: req.user });
    console.log(user);
    user.location = {
      type: 'Point',
      coordinates: [latitude, longitude]
    }
    const query = { latitude, longitude }
    const cities = nearbyCities(query)
    user.city = cities[0].name ? cities[0].name : "Mekelle"
    user.save()
    res.json(
      user
    );

  })
userRouter.get('/favourites',
  protect,
  async (req, res) => {

    const user = await User.find({ _id: req.user }).populate('favourites')
    if (user) {
      console.log(user)
      res.json(user && user[0].favourites ? user[0].favourites : [])

    }
    res.status(401)
  })

userRouter.post('/setting',
  protect,
  async (req, res) => {
    const { payment, isenabled,url,paymentforbig } = req.body
    console.log(req.body);
    const util = await Util.findOne()
    if (payment) {
      console.log('a')
      util.payment = payment
      util.paymentforbigitems = paymentforbig
      util.chapaurl = url
      util.paymentenabled = isenabled
    }

    else {
      util.paymentenabled = isenabled
    }
    const utilnow = await util.save()
    res.json(utilnow)


  })
userRouter.post('/sendpayment',
  protect,
  async (req, res) => {

    const { amount, id } = req.body
    console.log(req.body);
    Add.findOne({ _id: id }).then(async add => {
      if (add && add.postedBy.toString() == req.user._id.toString() && Number(amount) > 0) {
        console.log('up')
        add.islive = true
        add.save().then(addfinal => {
         
          res.json(addfinal)

        }).catch(err => {
          console.log(err)
          res.json(401)
        })
      }
      else {
        console.log('down')
        res.status(401)
      }
    }).catch(err => {
      console.log('down')
      res.status(401)
    })



    // const user = await User.findOne({ _id: req.user._id })
    // if (amount && parseInt(amount) > 0 && user) {
    //   user.balance = user.balance + parseInt(amount)
    //   await user.save()
    //   res.json({
    //     message: "Payment made successfully"
    //   })
    // }

    // else {
    //   res.status(400)
    // }


  })
userRouter.get('/getaddsetting',
  protect,
  async (req, res) => {
    try {
      const util = await Util.findOne()
      res.json(util)

    }
    catch (error) {
      res.status(401)
    }


  })
userRouter.get('/islocationenabled',
  protect,
  async (req, res) => {
    try {
      const user = await User.findOne({ _id: req.user._id })
      const util = await Util.findOne()
      // res.json(util)

      if (user.location.coordinates[0] && user.location.coordinates[1]) {

        res.json({
          message: "Location is saved successfully",

        });

      }
      else {
        res.json({
          message: "error",

        });
      }

    }
    catch (error) {
      res.status(401)
    }


  })


userRouter.post("/changepassword", protect, async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  const userID = req.user._id;
  let errors = [];

  //Check required fields
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    errors.push({ msg: "Please fill in all fields." });
  }

  //Check passwords match
  if (newPassword !== confirmNewPassword) {
    errors.push({ msg: "New passwords do not match." });
  }

  //Check password length
  if (newPassword.length < 5 || confirmNewPassword.length < 5) {
    errors.push({ msg: "Password should be at least six characters." });
  }

  if (errors.length > 0) {
    res.status(401).json({
      "errors": errors
    });
  } else {
    //VALIDATION PASSED
    //Ensure current password submitted matches

    User.findOne({ _id: userID }).then(async (user) => {
      //encrypt newly submitted password
      // async-await syntax
      const isMatch = await bcrypt.compare(currentPassword, user.password);

      if (isMatch) {
        console.log(user.password);
        //Update password for user with new password
        bcrypt.genSalt(10, (err, salt) =>
          bcrypt.hash(newPassword, salt, (err, hash) => {
            if (err) throw err;
            user.password = hash;
            user.save();
            res.json({ message: "Password successfully changed" })
          })
        );


      } else {
        //Password does not match
        errors.push({ msg: "Current password is not a match." });
        res.status(401).json({
          "error":
            errors
        });
      }
    });
  }
});
userRouter.delete("/user", protect, async (req, res) => {
  const id = req.user._id
  const user = await User.deleteOne({ _id: id });
  const adds = await Add.deleteMany({ postedBy: id })
  const rooms = await Room.deleteMany({
    $or: [{ userfrom: id }, { userto: id }]
  })
  const message = await Message.deleteMany({
    $or: [{ userfrom: id }, { userto: id }]
  })
  if (user) res.json({ message: "User deleted successfully" })
  else res.status(401)
})
export default userRouter;
