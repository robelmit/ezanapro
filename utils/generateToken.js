import jwt from "jsonwebtoken";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.secret, {
    expiresIn: "1y",
  });
};
// const generateToken = (id) => {
//   return jwt.sign({ id }, process.env.secret, {
//     expiresIn: "1y",
//   });
// };
export default generateToken;
