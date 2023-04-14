const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const Db=require('./database/db');
const mongoose=require('mongoose');
const chatSchema=require('./model/chat')
const RegisterSchema=require('./model/register')
const bcrypt = require('bcryptjs')
const cors = require("cors");
const jwt = require('jsonwebtoken');
app.use(express.json())
const router=express.Router();
const BD_CONNECTION="mongodb+srv://salahuddinsk933:XP0sOaD5wcBmN04D@chat.mhzjmi9.mongodb.net/?retryWrites=true&w=majority"

app.use(cors());

const server = http.createServer(app);
mongoose.Promise=global.Promise ;
mongoose.Promise = global.Promise;
mongoose.connect(BD_CONNECTION, () => console.log("database connected"))
const io = new Server(server,{
    cors:{
        origin: ["http://localhost:3000","https://massagebox.netlify.app"],
        optionsSuccessStatus: 200,
        credentials: true, 
        methods: ["GET", "POST"],
    }
}
    
    );


    app.use('/',router);


    let users = [];
    let users2=[]
    const addUser=(id,user)=>{
     if(!users2.some(e=>e.user===user)){
        users2.push({id,user})
     }
    
    }
    const removeUser=(id)=>{
        users2=users2.filter(e=>e.id!==id)
    }
    let room;
    io.on("connection", (socket) => {
       console.log('connected',socket.id)
        socket.on('getname',(User)=>{
           console.log(User)
            addUser(socket.id,User.User)
         
        })
        socket.on('joined', (data) => {
            
            users[socket.id] = data.user
            socket.join(data.room,()=>{
                   
            })
            room=data.room
            console.log(` ${users[socket.id]} has joined the ${data.room}`)
            io.to(data.room).emit('welcome',{message:`hey ${users[socket.id]} welcome to ${data.room}`})
            console.log(users)
            io.emit('member',{users2})
        })
     
        socket.on("message", ({ msg, id ,me,time,reciever}) => {
          console.log(me,id,msg)
          io.to(me).emit('sendMessage', { user: users[id], message: msg, id: id ,time,me})
          io.emit('notify',{ user: users[id], message: msg, id: id ,time,me,reciever})
          const msgs=  new chatSchema({user:users[socket.id],message:msg,id:id,me,time})
          msgs.save()
      })
      socket.on('disconnect', () => {
        removeUser(socket.id)
        io.to(room).emit('member',{users2})
        socket.broadcast.emit('leave', { user: 'Admin', message: `${users[socket.id]} has left` })
       
    })
});  

server.listen(process.env.PORT||4001, () => {
  console.log("SERVER IS RUNNING on http://localhost:4001");
});


router.get("/chat/all",function (req,res,next){
 
    chatSchema.find((error, data) => {
        if (error) {
        return next(error);
        } else {
        res.json(data);
      
        }
    });
    });

    router.get("/user/all",function (req,res,next){
 
      RegisterSchema.find((error, data) => {
          if (error) {
            console.log(error)
          return ;
          } else {
            let users=[]
            data.forEach(e => {
              delete e.Password
              users.push(e)
            });
          res.json(users);
        
          }
      });
      });

    router.post('/register/new', (req, res) => {

      let password=req.body.Password
      let data=req.body;
      data.Password=bcrypt.hashSync(password, 8),

      RegisterSchema.create(req.body, (error, data) => {
          if (error) {
            console.log(error)
              return 
          } else {
              
              res.status(200).json(data);
          }
      });

  
})
router.post("/login",async(req,res)=>{
  const {Email,Password}=req.body
  const user=await RegisterSchema.findOne({Email:req.body.Email});
 
  if(!user){
   return  res.status(400).json({"success":"false"})
}
let isMatch=bcrypt.compare(Password,user.Password)
  

if(isMatch){

  let token = jwt.sign( {"user":user},'mynameissalahuddinsksk',  { noTimestamp:true, expiresIn: '5m' });

  res.cookie("JWT",token,{
  maxAge:606*24*30
  })
  res.status(200).json({
  token
  })
}else{
  return res.status(403).json({"responce":"password does not match"})
}





})