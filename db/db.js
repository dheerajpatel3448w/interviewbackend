import mongoose from "mongoose";


const connectdb = async()=>{
    try {
      const connectionInstance =   await mongoose.connect('mongodb+srv://dominetar:dominetar3448w@cluster0.f6jpt.mongodb.net/interview');
        console.log(`MongoDB Connected: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("Error connecting to MongoDB", error.message);
       process.exit(1);
    }
}
export default connectdb;