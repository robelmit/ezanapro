import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      //unique: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    favourites: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Ads',
      }
    ],
    location: {
      type: {
        type: String,
        default: 'Point',
      },
      coordinates: {
        type: [Number]
      },
    },
    profile: {
      type: String,
      default: "https://www.ezana.site/guy.png"
    },
    city: {
      type: String,
    },
    balance: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
  }
);

// Login
userSchema.methods.matchPassword = async function (enterPassword) {
  return await bcrypt.compare(enterPassword, this.password);
};

// Register
// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) {
//     next();
//   }
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
// });

const User = mongoose.model("User", userSchema);

export default User;
