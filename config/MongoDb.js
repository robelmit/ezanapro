import mongoose from "mongoose";


const connectDatabase = async () => {
  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(process.env.MONGOURL, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
    // const conn = await mongoose.connect("mongodb://127.0.0.1/desta1pro", {
    //   useUnifiedTopology: true,
    //   useNewUrlParser: true,
    // });


    console.log(`MongoDB Connected`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // process.exit(1);
  }
};

export default connectDatabase;
