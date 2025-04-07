import { GoogleGenerativeAI } from "@google/generative-ai";
import cors from "cors";
import express from "express";
import { InterviewEvaluation } from "./models/interview.model.js";
import http from "http";
import { Server } from "socket.io";
import axios from "axios";
import multer from "multer";
import cookieParser from "cookie-parser";
import { createClient } from "@deepgram/sdk";
import fs from "fs";
import path from "path";
import router from "./routes/user.route.js";
import connectdb from "./db/db.js";
import { json } from "stream/consumers";
import { verifyToken } from "./service/auth.service.js";
let d={
  role: "",
  level: "",
  techstack: "",
  type: "",
  amount: "",
};
let f;
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}.mp3`);
  },
})
const upload =multer({
  storage: storage,
})

const app = express();
app.use(cookieParser());
app.use(express.urlencoded({
  extended: true,
}))
app.use(express.json());
const server = http.createServer(app);
const alloworigin =[
"http://localhost:5173","https://interview-aifrontend.vercel.app/"
]
const io = new Server(server, {
  cors: { origin:alloworigin ,credentials:true },
});

app.use(  cors({
  origin: "http://localhost:5173", // ✅ Allow frontend URL only
  credentials: true, // ✅ Allow cookies
}));
app.use(express.json());

const genAI = new GoogleGenerativeAI("AIzaSyCo7TMcB2VN62g6n_p4AwX1UipMckEyMIE");

const generateQuestions = async ({role,level,techstack,type,amount}) => {
 d = {...d, role: role, level: level,techstack:techstack,type:type,amount: amount}
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Job Role: ${role}
    Experience Level: ${level}
    Tech Stack: ${techstack}
    Question Focus (behavioural/technical): ${type}
    Number of Questions: ${amount}
    
    Instructions:
    - Generate exactly ${amount} interview questions.
    - The questions should focus on ${type} aspects, using the provided tech stack and experience level.
    - Do not include any additional text, explanations, or formatting symbols (such as "/" or "*").
    - The output must be an array of questions formatted like this: ["Question 1", "Question 2", "Question 3"]
    - Ensure the language is clear and appropriate for a voice assistant.
    
    Example:
    Input:
    Job Role: Software Developer
    Experience Level: Intermediate
    Tech Stack: JavaScript, React.js, Node.js
    Question Focus: technical
    Number of Questions: 3
    
    Expected Output:
    ["What are the key features of React.js?", "How do you handle state management in a Node.js application?", "Can you explain the event loop in JavaScript?"]
    
`
    const result = await model.generateContent(prompt);
    const response =  result.response.text(); // ✅ Await text properly
    let a = JSON.parse(response);
    

    return a; // ✅ Now parse correctly
  } catch (error) {
    console.error("Error generating questions:", error);
    return [];
  }
};

let questions = [];
let userAnswers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("start_interview", async (topic) => {
    console.log("Generating questions for:",topic);
    questions = await generateQuestions(topic);
    console.log(questions)

    userAnswers[socket.id] = []; // ✅ Ensure it's initialized
    sendNextQuestion(socket, 0);
  });

  socket.on("submit_answer", ({ index, answer ,data2}) => {
    console.log(answer);
    if (!userAnswers[socket.id]) userAnswers[socket.id] = []; // ✅ Fix error
    userAnswers[socket.id][index] = answer;

    if (index + 1 < questions.length) {
      sendNextQuestion(socket, index + 1);
    } else {
      analyzeAnswers(socket, userAnswers[socket.id],data2);
      f=[...userAnswers[socket.id]];
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    delete userAnswers[socket.id];
  });
});

const sendNextQuestion = (socket, index) => {
  socket.emit("next_question", { index, question: questions[index],lengthe: questions.length});
};

const analyzeAnswers = async (socket, answers2,data2) => {
  console.log("Analyzing answers:", data2,answers2,questions)
 let prompt= `You are an advanced AI interview evaluator. Your task is to analyze a candidate's performance during an interview based on their answers to given questions and the corresponding facial expression data. Return your evaluation strictly as a JSON object containing numeric scores and arrays of strings for qualitative feedback. Follow the instructions and format below exactly.

Instructions:

1. Question-Answer Comparison:
   - For each provided question and its corresponding answer, evaluate the candidate's accuracy.
   - Assign an overall numeric accuracy score (range 0-10) that reflects how well the answers address the questions.
   - Also, provide subjective feedback for each question as an array of strings (field: "questionFeedback").
   - Do not include any additional textual explanation beyond what is required.

2. Fluency Evaluation:
   - Evaluate the candidate’s fluency on a scale of 0-10 based on grammar, sentence structure, coherence, and articulation.
   - Return one numeric fluency score.

3. Communication Quality:
   - Evaluate the overall communication quality on a scale of 0-10 based on the clarity and effectiveness of conveying ideas.
   - Return one numeric communication score.

4. Facial Expression Analysis:
   - Using the provided facial expression data, evaluate:
     a. Confidence (0-10): How confidently the candidate presents themselves.
     b. Stress (0-10): A higher score indicates higher stress.
     c. Eye Contact (0-10): Consistency and quality of eye contact.
     d. Blink Rate: Provide the average blink rate in blinks per second as a number (this value can be fractional).
   - Return each of these as numeric values.

5. Additional Evaluations:
   - Clarity: Evaluate clarity on the basis of how well the candidate's question and answer representation is structured (0-10).
   - Engagement: Evaluate engagement based on facial data—specifically using the confidence, stress, and eye contact values (0-10).
   - Domain Expertise: Evaluate the candidate's subject knowledge based on the depth, accuracy, and correctness of the question–answer representation (0-10).

6. Overall Performance Score:
   - Calculate an overall performance score (range 0-10) as a composite measure of the above evaluations.
   - Return this as a single numeric value.

7. Qualitative Feedback (Arrays of Strings):
   - "improvements": Specific suggestions for improvement.
   - "feedback": Overall positive or constructive feedback.
   - "mistakes": List of detected mistakes.
   - "questionFeedback": Subjective feedback for each question.
   - "nextSteps": An array of actionable steps or recommendations that the candidate should follow to improve on the identified shortcomings.



 Input:
{
  "questions": ${questions},
  "answers": ${answers2},
  "facialData": {
    "confidence": ${data2.confidence},
    "stress": ${data2.stress},
    "eyeContact": ${data2.eyeContact},
    "blinkRate":${data2.blinkRate},
  }
}

Return output Format: please only give this format not add some extra keyword like json and more

{
  "accuracy": <number>,
  "fluency": <number>,
  "communication": <number>,
  "confidence": <number>,
  "stress": <number>,
  "eyeContact": <number>,
  "blinkRate": <number>,
  "overall": <number>,
  "improvements": [<string>, ...],  //give 5 size array
  "feedback": [<string>, ...],     //give 5 size array
  "mistakes": [<string>, ...],      //give 5 size array
  "questionFeedback": [<string>, ...],   //give 5 size array
  "clarity": <number>,
  "engagement": <number>,
  "domainExpertise": <number>,
  "nextSteps": [<string>, ...]   //give 5 size array
}


Important:
- All numeric scores must be numbers within the specified ranges.
- The qualitative fields ("improvements", "feedback", "mistakes", "questionFeedback", "nextSteps") must be returned as arrays of strings.
- Do not include any additional text, explanations, or commentary outside the JSON object.




    
     
`
  try {
    let data = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer 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",
        "HTTP-Referer": "<YOUR_SITE_URL>", // Optional. Site URL for rankings on openrouter.ai.
        "X-Title": "<YOUR_SITE_NAME>", // Optional. Site title for rankings on openrouter.ai.
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "deepseek/deepseek-r1:free",
        "messages": [
          {
            "role": "user",
            "content":prompt,    
          }
        ]
      })
    })
    let response = await data.json();
    console.log(response.choices[0].message.content);
   let b = JSON.parse(response.choices[0].message.content);
   console.log(b);
    
    socket.emit("analysis_report", b);
  } catch (error) {
    console.error("Error analyzing answers:", error);
    socket.emit("analysis_report", "Error analyzing responses.");
  }
};
app.post("/api/deepgram/speak", async (req, res) => {
  try {
    const { text } = req.body;

    const response = await axios.post(
      "https://api.deepgram.com/v1/speak",
      { text },
      {
        headers: {
          Authorization: `Token ecf2becb517cf663951d968b236385d4cb5eca32`,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer", // Required for audio data
      }
    );

  
    res.send(response.data);
  } catch (error) {
    console.error("Deepgram Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Deepgram API request failed" });
  }
});
 // Save as WAV
 app.post("/api/deepgram/stt", upload.single("audio"), async (req, res) => {

      if (!req.file) {
          return res.status(400).json({ error: "No audio file uploaded" });
      }
// index.js (node example)
let a = req.file.filename;
console.log(a);
let b = path.join("C:/Users/patel/OneDrive/Desktop/thapa node,js'/discord/WEBSOKET/uploads",`${req.file.filename}`);

const transcribeFile = async () => {
  // STEP 1: Create a Deepgram client using the API key
  const deepgram = createClient("06bf88ee40b231e5a1695e600131b39f5035da9b");

  // STEP 2: Call the transcribeFile method with the audio payload and options
  const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
    // path to the audio file
    fs.readFileSync(b),
    // STEP 3: Configure Deepgram options for audio analysis
    {
      model: "nova-3",
      smart_format: true,
    }
  );

  if (error) throw error;
  // STEP 4: Print the results
  if (!error) console.dir(result, { depth: null });
  res.json(result.results.channels[0].alternatives[0].transcript);
};

transcribeFile();

          }  )


app.post('/submitreport',async(req, res) => {
  const report = (req.body)
  console.log("ok",report);
  if(!report) return res.send("op");
  const token = req.cookies.token;
  console.log("token",token);

  const user = await verifyToken(token);
  console.log(report,"ok");
  const op = await InterviewEvaluation.findOne({
    accuracy: report.accuracy,
    fluency: report.fluency,
    communication: report.communication,
    confidence: report.confidence,
    stress: report.stress,
    eyeContact: report.eyeContact,
    blinkRate: report.blinkRate,
    overall: report.overall,
    improvements: report.improvements,
    feedback: report.feedback,
    mistakes: report.mistakes,
    questionFeedback: report.questionFeedback,
    clarity: report.clarity,
    engagement: report.engagement,
    domainExpertise: report.domainExpertise,
    nextSteps: report.nextSteps,
    role:d.role.toLowerCase().trim(),level:d.level.toLowerCase().trim().split(/\s+/).join(''),techstack:d.techstack.toLowerCase().trim().split(/\s+/).join(''),type:d.type.toLowerCase(),amount:d.amount,
    user:user._id
  })
  if(op){
    res.json({ success: false, message: "Report already exists" });
    return;
  }
  const data = await InterviewEvaluation.create({
    accuracy: report.accuracy,
    fluency: report.fluency,
    communication: report.communication,
    confidence: report.confidence,
    stress: report.stress,
    eyeContact: report.eyeContact,
    blinkRate: report.blinkRate,
    overall: report.overall,
    improvements: report.improvements,
    feedback: report.feedback,
    mistakes: report.mistakes,
    questionFeedback: report.questionFeedback,
    clarity: report.clarity,
    engagement: report.engagement,
    domainExpertise: report.domainExpertise,
    nextSteps: report.nextSteps,
    role:d.role.toLowerCase().trim().split(/\s+/).join(''),level:d.level.toLowerCase().trim().split(/\s+/).join(''),techstack:d.techstack.toLowerCase().trim().split(/\s+/).join(''),type:d.type.toLowerCase(),amount:d.amount,
    user:user._id
  })
console.log(data);
  res.json({ success: true });
})
app.post("/overallsubmit",async(req,res)=>{
  const {role,level,techstack} = req.body;
  console.log({role,level,techstack});
  const token = req.cookies.token;
  console.log("token",token);
  const user = await verifyToken(token);
  const data2= await InterviewEvaluation.find({user:user._id,role:role.toLowerCase().trim().split(/\s+/).join(''),level:level.toLowerCase().trim().split(/\s+/).join(''),techstack:techstack.toLowerCase().trim().split(/\s+/).join('')});
  console.log(data2);
  res.json({ success: data2});
})


          app.use(router);
          const port = process.env.PORT||5000
          console.log(process.env.PORT)
connectdb().then(()=>{
  server.listen(port, () => console.log("Server running on port",port));
})

