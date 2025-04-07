import mongoose from "mongoose";

const InterviewEvaluationSchema = new mongoose.Schema({
  accuracy: { type: Number, required: true },
  fluency: { type: Number, required: true },
  communication: { type: Number, required: true },
  confidence: { type: Number, required: true },
  stress: { type: Number, required: true },
  eyeContact: { type: Number, required: true },
  blinkRate: { type: Number, required: true },
  overall: { type: Number, required: true },
  improvements: { type: [String], required: true },
  feedback: { type: [String], required: true },
  mistakes: { type: [String], required: true },
  questionFeedback: { type: [String], required: true },
  clarity: { type: Number, required: true },
  engagement: { type: Number, required: true },
  domainExpertise: { type: Number, required: true },
  nextSteps: { type: [String], required: true },
 role:{
  type: String,
  
 },
 level:{
   type: String,
    
},
techstack:{
  type: String
 },
 type:{
  type: String,
 },
 amount:{
  type: Number,
 },


  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref: 'User',
  
  }
}, { timestamps: true });

export const InterviewEvaluation = mongoose.model('InterviewEvaluation', InterviewEvaluationSchema);


