import express from "express";
import asyncHandler from "express-async-handler";
import Ads from "./../Models/Ad.js";
import { admin, protect } from "../Middleware/AuthMiddleware.js";
import multer from 'multer';
import path from 'path';
import { log } from "console";
import User from "../Models/User.js";
import { lookUp } from "geojson-places";
import sharp from 'sharp'
import moment from 'moment'
import Util from "../Models/Util.js";
const Adsrouter = express.Router();
var storage = multer.diskStorage({
  destination: 'images',
  // function(req, file, cb) {
  //   cb(null, path.join('D:', 'desta', '/server'));
  // },
  // },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '_' + Date.now() + path.extname(file.originalname))
  }

});

var upload = multer({
  storage: storage,
  limits: {
    fileSize: 20000000
  },
  // fileFilter(req, file, cb) {
  //   if (!file.originalname.match(/\.(png|jpg)$/)) {
  //     return cb(new Error('please upload images'));

  //   }
  //   cb(undefined, true);
  // },
});


// GET ALL PRODUCT
Adsrouter.post(
  "/getadd",

  asyncHandler(async (req, res) => {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;
    const { catagory, status, detailcatagory, maincatagory, region, city, fuel, EngineSize, transmission, color, year, model } = req.body
    const { distance, minprice, maxprice, filter } = req.body
    const { tags, longitude, latitude } = req.body
    console.log(req.body)
    var morequery = {}
    var range = {}
    var sortby = { _id: -1 };
    if (filter) {
      if (filter == "newest") {
        sortby = { _id: -1 };

      }
      if (filter == "pricelow") {
        sortby = { price: 1 };

      }
      if (filter == "pricemax") {
        sortby = { price: -1 };

      }

    }
    // status,detailcatagory,region

    if (status) {
      morequery.status = status
    }
    if (catagory) {
      morequery.catagory = catagory
    }
    if (maincatagory) {
      morequery.maincatagory = maincatagory
    }
    if (region) {
      morequery.region = region
    }
    if (region) {
      morequery.region = region
    }
    //city,fuel,EngineSize,transmission
    if (city) {
      morequery.city = city

    }
    if (fuel) {
      morequery.fuel = fuel

    }
    if (EngineSize) {
      morequery.engineSize = EngineSize

    }
    if (transmission) {
      morequery.region = region

    }

    if (color) {
      morequery.color = color

    }
    if (year) {
      morequery.year = year

    }
    if (model) {
      morequery.model = model

    }

    if (detailcatagory && detailcatagory.length != 0) {
      console.log(detailcatagory.length)
      morequery.detailcatagory = { $in: detailcatagory }
    }
    // 
    if ((minprice && maxprice) && (Number(minprice) < Number(maxprice))) {
      console.log('nice');
      // const thisweekadd = await Ads.find({ createdAt: { '$gte': thisweekstart, '$lte': end } })

      morequery.price = { '$gte': minprice, '$lte': maxprice }

      console.log(range);
      // console.log(morequery);
      // morequery.price =price :{ $gte: Number(minprice)}, $lte: Number(maxprice) };
    }
    morequery.isLive = true
    const keyword = req.query.keyword
      ? {
        title: {
          $regex: req.query.keyword,
          $options: "i",
        },
        ...morequery

      }
      : {
        ...morequery
      }
      ;
    console.log(keyword)

    var counter;
    if (detailcatagory && distance && longitude && latitude) {
      console.log('we are hitting here');
      if (req.query.keyword) {
        console.log('nice');
        counter = await Ads.find({
          ...keyword,

          location: {
            $near: {
              $maxDistance: distance * 1000,
              // distance in meters
              $geometry: {
                type: 'Point',
                coordinates: [latitude, longitude]

              }
            }
          }
        });
      }
      else {
        // console.log('bro');
        counter = await Ads.find({
          location: {
            $near: {
              $maxDistance: distance * 1000,
              // distance in meters
              $geometry: {
                type: 'Point',
                coordinates: [latitude, longitude]

              }
            }
          },

        }

        );

        // console.log(counter)
      }

      const adds = await Ads.find({
        ...keyword,
        location: {
          $near: {
            $maxDistance: distance * 1000,
            // distance in meters
            $geometry: {
              type: 'Point',
              coordinates: [latitude, longitude]

            }
          }
        },

      })
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort(sortby);
      //res.json(adds);
      console.log(counter)
      console.log('counter')
      res.json({ adds: adds ? adds : [], page, pages: Math.ceil((counter ? counter.length : 0) / pageSize) ? Math.ceil((counter ? counter.length : 0) / pageSize) : 0 });
    }
    else if (detailcatagory && !distance && !longitude && !latitude) {
      console.log(tags)
      var countproitem;

      if (req.query.keyword) {
        countproitem = await Ads.countDocuments({ ...keyword });
      }
      else {
        countproitem = await Ads.countDocuments();
      }
      const tagadds = await Ads.find({ ...keyword })
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort(sortby);
      //res.json(adds);

      res.json({ adds: tagadds, page, pages: Math.ceil(countproitem / pageSize) });
    }
    else if (!detailcatagory && distance && longitude && latitude) {
      console.log('this is professional ');


      if (req.query.keyword) {
        counter = await Ads.find({
          ...keyword,

          location: {
            $near: {
              $maxDistance: distance * 1000,
              // distance in meters
              $geometry: {
                type: 'Point',
                coordinates: [latitude, longitude]

              }
            }
          }
        });
      }
      else {
        console.log('bro');
        counter = await Ads.find({

          location: {
            $near: {
              $maxDistance: distance * 1000,
              // distance in meters
              $geometry: {
                type: 'Point',
                coordinates: [latitude, longitude]

              }
            }
          }
        });
      }

      const adds = await Ads.find({
        ...keyword,

        location: {
          $near: {
            $maxDistance: distance * 1000,
            // distance in meters
            $geometry: {
              type: 'Point',
              coordinates: [latitude, longitude]

            }
          }
        }
      })
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort(sortby);
      //res.json(adds);
      console.log(counter)
      console.log('counter')
      res.json({ adds: adds ? adds : [], page, pages: Math.ceil((counter ? counter.length : 0) / pageSize) ? Math.ceil((counter ? counter.length : 0) / pageSize) : 0 });
    }
    else {
      console.log('final test case')
      var countpro;

      countpro = await Ads.countDocuments({ ...keyword });
      const adds = await Ads.find({ ...keyword })
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort(sortby);

      //res.json(adds);

      res.json({ adds, page, pages: Math.ceil(countpro / pageSize) });
    }


  })
);
Adsrouter.get(
  "/oll",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;
    const keyword = req.query.keyword
      ? {
        title: {
          $regex: req.query.keyword,
          $options: "i",
        },
      }
      : {

      };
    const count = await Ads.countDocuments({ ...keyword });
    const adds = await Ads.find({ ...keyword })
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort();
    res.json({ adds, page, pages: Math.ceil(count / pageSize) });
  })
);

Adsrouter.get(
  "/catagory",
  //protect,
  asyncHandler(async (req, res) => {
    // const pageSize = 12;
    // const page = Number(req.query.pageNumber) || 1;
    const catagory = req.query.catagory
    //   console.log(catagory)
    const keyword = {
      catagory,
    }

    const count = await Ads.countDocuments({ ...keyword });
    const ads = await Ads.find({ ...keyword })
      // .limit(pageSize)
      // .skip(pageSize * (page - 1))
      .sort({ _id: -1 });
    res.json(ads);
    // res.json({ products, page, pages: Math.ceil(count / pageSize) });
  })
);
Adsrouter.get(
  "/user",
  protect,
  asyncHandler(async (req, res) => {
    // const pageSize = 12;
    // const page = Number(req.query.pageNumber) || 1;

    const ads = await Ads.find({ postedBy: req.user._id })
    if (ads) res.json(ads);
    else res.json(401)

  })
);
Adsrouter.get(
  "/adduser/:id",
  protect,
  asyncHandler(async (req, res) => {
    // const pageSize = 12;
    const id = req.params.id
    console.log(id)

    const ads = await Ads.find({ postedBy: id })
    console.log(ads)
    if (ads) res.json(ads);
    else res.json(401)

  })
);

// ADMIN GET ALL PRODUCT WITHOUT SEARCH AND PEGINATION
Adsrouter.get(
  "/all",
  protect,
  // admin,
  asyncHandler(async (req, res) => {
    const products = await Ads.find({}).sort({ _id: -1 });
    res.json(products);
  })
);

// GET SINGLE PRODUCT
Adsrouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const product = await Ads.findOne({ _id: req.params.id }).populate('postedBy')
    if (product) {
      res.json(product);
    } else {
      res.status(404);
      throw new Error("ad  not Found");
    }
  })
);


// PRODUCT REVIEW
Adsrouter.post(
  "/:id/review",
  protect,
  asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const product = await Ads.findById(req.params.id);

    if (product) {
      const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
      );
      if (alreadyReviewed) {
        res.status(400);
        throw new Error("Product already Reviewed");
      }
      const review = {
        name: req.user.name,
        rating: Number(rating),
        comment,
        user: req.user._id,
      };

      product.reviews.push(review);
      product.numReviews = product.reviews.length;
      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;

      await product.save();
      res.status(201).json({ message: "Reviewed Added" });
    } else {
      res.status(404);
      throw new Error("Product not Found");
    }
  })
);

// DELETE PRODUCT
Adsrouter.delete(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const product = await Ads.findByIdAndDelete(req.params.id);
    if (product) {
      res.json({ message: "Product deleted" });
    } else {
      res.status(404);
      throw new Error("Product not Found");
    }
  })
);
Adsrouter.delete(
  "/user/:id",
  protect,
  asyncHandler(async (req, res) => {
    const product = await Ads.findByIdAndDelete(req.params.id);
    if (product) {
      res.json({ message: "Product deleted" });
    } else {
      res.status(404);
      throw new Error("Product not Found");
    }
  })
);

Adsrouter.post(
  "/image",
  upload.array('image', 5),
  (req, res) => {
    let imagepro = []
    let istrue = true;

    req.files.map(async file => {
      // const newFilename = ...;

      // await sharp(file.buffer)
      //   .resize(640, 320)
      //   .toFormat("jpeg")
      //   .jpeg({ quality: 90 })
      //   .toFile(`upload/${newFilename}`);
      const ref = `web-${file.originalname}.webp`;
      // console.log(file)
      console.log(file)
      await sharp(file.path)
        .webp({ quality: 40 })
        .toFile("./images/" + file.filename.split('.')[0] + '.webp');

    })
    for (let i = 0; i < req.files.length; i++) {

      imagepro.push({ url: "https://www.ezana.site/" + req.files[i].filename.split('.')[0] + '.webp', isprimary: istrue });
      // imagepro.push({ url: "http://robel.eu-4.evennode.com/" + req.files[i].filename, isprimary: istrue });
      istrue = false
    }
    //console.log(imagepro)
    // console.log(req.files)
    res.json(imagepro)
  }
);
// CREATE PRODUCT
Adsrouter.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {


    const { title, images, description, catagory, price, maincatagory, status, detail, transmission, detailcatagory,
      engineSize,
      fuel,
      mileAge, model, color, year
    } = req.body;



    console.log(maincatagory);
    console.log(req.body);
    // const productExist = await Ads.findOne({  });
    if (!req.user?.location.coordinates[0] || !req.user?.location.coordinates[1]) {
      res.status(400);
      throw new Error("Send your location first ");
    } else {
      const setting = await Util.findOne()
      var isalive = true;
      if (setting.paymentenabled) {
        isalive = false
      }

      //console.log(req.user.location.coordinates[0])
      const userlocation = { type: 'Point', coordinates: [req.user.location.coordinates[0], req.user.location.coordinates[1]] }
      var region;
      const checkregion = lookUp(req.user.location.coordinates[0], req.user.location.coordinates[1]).state_code
      // const city = nearbyCities({latitude:req.user.location.coordinates[0], longitude:req.user.location.coordinates[1]})

      if (checkregion == 'ET-AA') {
        region = 'addisababa'
      }
      else if (checkregion == 'ET-DD') {
        region = 'diredawa'
      }
      else if (checkregion == 'ET-AM') {
        region = 'amhara'
      }
      else if (checkregion == 'ET-HA') {
        region = 'harar'
      }
      else if (checkregion == 'ET-SN') {
        region = 'South'
      }
      else if (checkregion == 'ET-OR') {
        region = 'oromia'
      }
      else if (checkregion == 'ET-SO') {
        region = 'somali'
      }

      else if (checkregion == 'ET-TI') {
        region = 'tigray'
      }
      else if (checkregion == 'ET-AF') {
        region = 'Afar'
      }
      else if (checkregion == 'ET-BE') {
        region = 'benshangul'
      }
      else if (checkregion == 'ET-GA') {
        region = 'gambela'
      }
      else {
        region = 'addisababa'
      }

      var morequeries = {

      }
      if (transmission) {
        morequeries.transmission = transmission
      }
      if (engineSize) {
        morequeries.engineSize = engineSize

      }
      if (fuel) {
        morequeries.fuel = fuel

      }
      if (mileAge) {
        morequeries.mileAge = mileAge

      }
      if (color) {
        morequeries.color = color

      }
      if (year) {
        morequeries.year = year

      }
      if (model) {
        morequeries.model = model

      }



      const user = await User.findOne({ _id: req.user._id })
      const util = await Util.findOne()

      const ad = new Ads({
        title,
        images,
        description,
        catagory,
        postedBy: req.user._id,
        price: parseInt(price),
        maincatagory,
        detailcatagory,
        location: userlocation,
        region,
        city: req.user.city,
        status,
        islive: isalive,
        detail,
        ...morequeries

      });
      if (ad && user) {
        if (util.paymentenabled == true) {


          user.balance = ((user.balance - util.payment) > 0) ? (user.balance - util.payment) : 0
          await user.save()


        }
        const createdproduct = await ad.save();


        res.status(201).json(createdproduct);
      } else {
        res.status(400);
        throw new Error("Unable to post add");
      }
    }
  })
);

// UPDATE PRODUCT
Adsrouter.put(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {


    const { price, title, description, catagory, maincatagory, detailcatagory, status, images, mileAge, fuel, engineSize, transmission, model, year } = req.body;
    const ad = await Ads.findById(req.params.id);
    if (ad && req.user._id.toString() == ad.postedBy.toString()) {
      ad.title = title || ad.title;
      ad.price = price || ad.price;
      ad.description = description || ad.description;
      ad.images = images || ad.images;
      ad.catagory = catagory || ad.catagory;
      ad.maincatagory = maincatagory || ad.maincatagory;
      ad.detailcatagory = detailcatagory || ad.detailcatagory;
      ad.status = status || ad.status;
      ad.mileAge = mileAge || ad.mileAge;
      ad.fuel = fuel || ad.fuel;
      ad.transmission = transmission || ad.transmission;
      ad.engineSize = engineSize || ad.engineSize;
      ad.model = model || ad.model;
      ad.year = year || ad.year;
      ad.islive = true

      const Updatedad = await ad.save();
      res.json(Updatedad);
    } else {
      res.status(404);
      throw new Error("Product not found");
    }
  })
);


Adsrouter.get('/all/dashboared', async (req, res) => {
  const adds = await Ads.countDocuments();
  const users = await User.countDocuments();
  var todaystart = moment().startOf('day');
  // end today
  var thismonthstart = moment().startOf('month');   // set to the first of this month, 12:00 am
  var thisyearstart = moment().startOf('year');   // set to the first of this month, 12:00 am
  var thisweekstart = moment().startOf('week');
  var end = moment(todaystart).endOf('day');

  const todayadd = await Ads.find({ createdAt: { '$gte': todaystart, '$lte': end } })
  const thisweekadd = await Ads.find({ createdAt: { '$gte': thisweekstart, '$lte': end } })
  const thismonthadd = await Ads.find({ createdAt: { '$gte': thismonthstart, '$lte': end } })
  const todayuser = await User.find({ createdAt: { '$gte': todaystart, '$lte': end } })
  const thisweekuser = await User.find({ createdAt: { '$gte': thisweekstart, '$lte': end } })
  const thismonthuser = await User.find({ createdAt: { '$gte': thismonthstart, '$lte': end } })
  const thisyearuser = await User.find({ createdAt: { '$gte': thisyearstart, '$lte': end } })
  //users,
  //adds,
  if (users) {
    res.json({
      users,
      adds,
      todayadd,
      thisweekadd,
      thismonthadd,
      todayuser,
      thisweekuser,
      thismonthuser,
      thisyearuser
    })
  }
  else {

    res.status(404).json({
      message: "Error on sending"
    })
  }
})
export default Adsrouter;







// this is the cool thing