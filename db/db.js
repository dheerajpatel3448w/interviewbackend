import mongoose from "mongoose";


const connectdb = async()=>{
    try {
      const connectionInstance =   await mongoose.connect(`${process.env.MONGO}`);
        console.log(`MongoDB Connected: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("Error connecting to MongoDB", error.message);
       process.exit(1);
    }
}
export default connectdb;