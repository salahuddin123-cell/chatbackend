const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const Db=require('./database/db');
const mongoose=require('mongoose');
const chatSchema=require('./model/chat')
const RegisterSchema=require('./model/register')
const Groupschema=require('./model/group')
const bcrypt = require('bcryptjs')
const cors = require("cors");
const jwt = require('jsonwebtoken');
var bodyParser = require('body-parser');

const router=express.Router();
const BD_CONNECTION="mongodb+srv://salahuddinsk933:XP0sOaD5wcBmN04D@chat.mhzjmi9.mongodb.net/?retryWrites=true&w=majority"
var cookies = require("cookie-parser");

app.use(cookies());

app.use(cors({credentials: true, origin: ['http://localhost:3000','https://massagebox.netlify.app']}));
app.use(express.json());
app.use(express.urlencoded({limit: '25mb', extended: true}));

const server = http.createServer(app);
mongoose.Promise = global.Promise;
const connectToMongo = async () => {
    try {
        mongoose.set('strictQuery', false)
        mongoose.connect(BD_CONNECTION) 
        console.log('database connected')
    }
    catch(error) {
        console.log(error)
        process.exit()
    }
    }
connectToMongo()


const io = new Server(server,{
    cors:{
        origin: ["http://localhost:3000","https://massagebox.netlify.app","http://192.168.0.102:3000"],
        optionsSuccessStatus: 200,
        credentials: true, 
        methods: ["GET", "POST"],
    }
}
    
    );
    const isAuthenticated=async(req,res,next)=>{
      const token=req.cookies.token;
    
    
      if(!token){
        return res.status(404).json({success:false,message:"Please login"})
      }
      const decoded=jwt.verify(token,"mynameissalahuddinsksk")
    
      req.user=await RegisterSchema.findById(decoded._id)
      next()
  }

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
     
        socket.on("message", ({ msg, id ,me,image,time,reciever}) => {
          console.log(me,id,msg)
          io.to(me).emit('sendMessage', { user: users[id],image:image, message: msg, id: id ,time,me})
          io.emit('notify',{ user: users[id], message: msg,image:image, id: id ,time,me,reciever})
          const msgs=  new chatSchema({user:users[socket.id],message:msg,image:image,id:id,me,time})
          msgs.save()
      })
      socket.on('disconnect', () => {
        removeUser(socket.id)
        io.to(room).emit('member',{users2})
        socket.broadcast.emit('leave', users[socket.id])
       
    })
    socket.emit("me", socket.id)
    socket.on("callUser", (data) => {
      io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name })
    })
  
    socket.on("answerCall", (data) => {
      io.to(data.to).emit("callAccepted", data.signal)
    })
    socket.on("callended", (data) => {
      io.to(data.to).emit("callended", data)
    })
});  

server.listen(process.env.PORT||4001, () => {
  console.log("SERVER IS RUNNING on http://localhost:4001");
});


router.post("/chat/all",function (req,res,next){
 
    chatSchema.find({me:req.body.room},(error, data) => {
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
             users.push({_id:e._id,Name:e.Name,Email:e.Email,Occupation:e.Occupation,image:e.image,Lastseen:e.Lastseen})
            });
          res.json(users);
        
          }
      });
      });

    router.post('/register/new', async(req, res) => {
      try {
        let password=req.body.Password
        let data=req.body;
        data.Password=bcrypt.hashSync(password, 8);
        let user= await RegisterSchema.create(data);
        let token = jwt.sign( {user:user},'mynameissalahuddinsksk',  { noTimestamp:true, expiresIn: '5m' });
        res.cookie("token",token,{
                withCredentials: true,
                httpOnly: false,
                maxAge:5*60*1000
            })
              res.status(201).json({
             token
              })
      } catch (error) {
        res.status(403).json({error})
      }
     
          
      });
router.post('/userupdate/:id',async(req,res)=>{
  try {
   res=await RegisterSchema.findByIdAndUpdate({_id:req.params.id},{Name:req.body.Name,Occupation:req.body.status})
    .then(data=>{res.status(201).json(data),console.log(data)})
    console.log(res)
  } catch (error) {
    console.log(error)
  }
})
router.post('/deleteuser/:id',async(req,res)=>{
  try {
   await RegisterSchema.findByIdAndDelete(req.params.id)
    .then(data=>{res.status(201).json({success:true,message:"deleted"})})
    
  } catch (error) {
    console.log(error)
  }
})

router.post('/creategroup',async(req,res)=>{
  try {
    await Groupschema.create(req.body)
    .then(data=>res.status(201).json(data))
  } catch (error) {
    console.log(error)
  }
})  
router.post('/getgroup',async(req,res)=>{
  let userid=req.body._id
  
  try {
    let grp= await Groupschema.find()

    let g=grp.filter(e=>{
      if((e.ids).includes(userid)){
        return e
      }
    })
    
    res.status(200).json(g)
  } catch (error) {
    console.log(error)
  }
})
router.post('/groupupdate',async(req,res)=>{
try {
  await Groupschema.updateOne({Name:req.body.Name},{$set:{users:req.body.users,ids:req.body.ids}})
  .then(data=>res.status(201).json(data))
} catch (error) {
  console.log(error)
}
})
// router.post('/leavegroup',async(req,res)=>{
//   let gname=req.body.gname;
//   let id=req.body.id
//   let Name=req.body.Name
//   let new_users=(req.body.users).filter(e=>e!=Name)
//   let newids=(req.body.ids).filter(e=>e!=id)
//   try {
//     await Groupschema.updateOne({Name:gname},{$set:{users:new_users,ids:newids}})
//     .then(data=>res.status(201).json(data))
//   } catch (error) {
//     console.log(error)
//   }
//   })

router.post('/user/lsupdate', (req, res) => {

  let Name=req.body.data
 

 
  RegisterSchema.updateOne({Name:Name},{$set:{Lastseen:new Date().getTime()}}, (error, data) => {
      if (error) {
        res.status(400).json({"error":error});
          return 
      } else {
          
          res.status(200).json(data);
      }
  });


})

router.post("/login",async(req,res)=>{
  const {Email,Password}=req.body
 
  await RegisterSchema.findOne({ Email })
  .then(user => {
      //if user not exist than return status 400
      if (!user) return res.status(400).json({ msg: "User not exist" })

      //if user exist than compare password
      //password comes from the user
      //user.password comes from the database
      bcrypt.compare(Password, user.Password, (err, data) => {
          //if error than throw error
          if (err) {
            return res.status(404).json({ error: err })
          }


          //if both match than you can do anything
          if (data) {
            let token = jwt.sign( {user:user},'mynameissalahuddinsksk',  { noTimestamp:true, expiresIn: '5m' });

            res.cookie("token", token, {
              withCredentials: true,
                  httpOnly: false,
                  maxAge:5*60*1000
             })
            res.status(200).json({
            token
            })
          } else {
              return res.status(403).json({ msg: "Invalid credencial" })
          }

      })

  })
 





})