import express  from "express";
import cors from 'cors'
import bodyParser from "body-parser";
const app = express();

app.use(express.json({limit: '50mb'}));
//app.use(express.urlencoded({limit: '50mb'}));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb'}));


const PORT = 5000; // or any other port you want
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



export default app;