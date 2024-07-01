var exp=require('express')
var jwt =require("jsonwebtoken")
let crypto=require('crypto')

var app=exp();
var cors=require('cors')

let multer=require('multer');
let fs=require('fs');
let secret="hellobrothersarath123"
let arrcart=[];
//const { OAuth2Client } = require('google-auth-library');
let upload=multer(
{dest:'uploads/'}
)



//app.use(exp.urlencoded({ extended: true }));
app.use(cors())


//var mysql=require('mysql');
var path=require('path')
var bodyparse=require('body-parser');
app.use(bodyparse.json({ limit: '10mb' }))

app.use(exp.static(path.join(__dirname,'dist')))

var uri="mongodb+srv://sarath:mongodb@sarath.pwemxqm.mongodb.net/?retryWrites=true&w=majority";

const { MongoClient, ServerApiVersion } = require('mongodb');


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri/*, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
    //useNewUrlParser: true,
    useUnifiedTopology: true,

  }
}*/);


async function run() {

    // Connect the client to the server	(optional starting in v4.7)
     await client.connect();
    // Send a ping to confirm a successful connection
    let  mong=  await client.db("college");
    mong.collection('register').createIndex({mobile:1})
    mong.collection('register').createIndex({orders:1})
    mong.collection('register').createIndex({ requestId: 1 });
    mong.collection('register').createIndex({ items: 1 });

     console.log("Pinged your deployment. You successfully connected to MongoDB!");

     return mong
}


app.post("/register",(req,re)=>{

  
   run().then(async(hj)=>{

     let d= await hj.collection('register').find({$or:[{email:req.body.email},{mobile:req.body.mobile}]}).toArray()

    

     if(d.length==0){
        hj.collection('register').insertOne({name:req.body.name,email:req.body.email,password:req.body.password,mobile:req.body.mobile}).then(j=>{
             re.json({message:"successfully inserted"})
        })
       }
     else if(d.length!=0){
          d.forEach(dr=>{
                  if(dr.email===req.body.email){
                    re.json({message:"email already exists"})
                  }
                 else if(dr.mobile===req.body.mobile){
                    re.json({message:"mobile already exists"})
                  }
                  else if(dr.mobile===req.body.mobile&&dr.email===req.body.email){
                    re.json ({message:"both mobile and email are exists"})
                  }

          })
     }


      })
})

app.post('/addcategory',upload.single('image'),(req,res)=>{
  let dj=JSON.parse(req.body.data)
  //testjg
  let imagepath=req.file.path
  let imageBuffer = fs.readFileSync(imagepath);
  //converting base64 to binary
  let binary= Buffer.from(imageBuffer)     
  console.log(binary)
  run().then(kt=>{

    kt.collection("category").findOne({categoryname:dj}).then(k=>{
        
      if(k==null){

       try{
         run().then(g=>{
          
          g.collection("category").insertOne({categoryname:dj,image: binary}).then(kj=>{
                
             res.json({message:"successfully inserted",data:kj})
             
          })
         
        })
      }
      catch(err){
        console.log(err)
      }

      }

      else{
        res.json({message:"category already exists"})
      }

    })

  })
    


 
})

app.put('/additem',upload.single('itemim'),(req,res)=>{

   let df=JSON.parse(req.body.data)
   let imagepath=req.file.path
   

   let imageBuffer = fs.readFileSync(imagepath);
   //converting base64 to binary
   let binary= Buffer.from(imageBuffer)

   run().then(g=>{
     
    g.collection("category").updateOne({categoryname:df.name},{$push:{items:{itemname:df.itemname,itemimage:binary,price:df.price,description:df.description,material:df.material,colour:df.colour}}}).then((h)=>{
      if(h.matchedCount==0){
        res.json({message:"please select right name"})
      }
      else{
      
       res.json({message:"successfully added"})
      }
    })


  })

})

app.delete("/deleteitemincategory/:id",(req,res)=>{
  console.log(req.params.id)
 run().then(y=>{
   y.collection('category').updateMany({},{$pull:{items:{itemname:req.params.id}}}).then(k=>{
    console.log(k)
   })


 })
})


app.get('/getcategories',(req,res)=>{
    run().then(j=>{
    
     //   j.collection("category").find({},{projection:{categoryname:1,_id:0}}).toArray().then((result)=>{
          j.collection("category").find({}).toArray().then((result)=>{
          if(result==null){
            res.json({message:"category not available"})
          }
      else{
         result.forEach((pk)=>{
           for(let x in pk){
             if(x=="image"){
              // converting binary to base64
                //binary str.buffer.toString("base64")
              pk[x]= pk[x].buffer.toString("base64");
             }
           }
          })
            res.json({message:result})
          }
        })
        

    })

})

app.post('/login',(req,res)=>{

     
     run().then(async dj=>{

     // let r=await dj.collection('register').find({mobile:req.body.mobil}).toArray()  
       
      dj.collection('register').findOne({mobile:req.body.mobil}).then(p=>{
           console.log(p)
              if(p==null){
                res.json({message:"please register"})
              }
             else if(p!=null){
               if(p.password!=req.body.passwor){
                res.json({message:"invalid password"})
               }
               else{
                jwt.sign({mobile:p.mobile},secret,{expiresIn:"5h"},(err,signedtoken)=>{
                  if(err){
                    console.log(err)
                  }
                  else{
                  res.json({message:"validuser",token:signedtoken,dj:p})
                  }
                })
               }
             }
            

      })
     })

})

app.put('/increcart',(req,res)=>{
 
  // console.log(req.headers)
  let token =req.headers.authorization
    console.log("hello")
 console.log(token)
// console.log(token)
 
  jwt.verify(token,secret,async (err,decoded)=>{
    if(err){
      console.log(err)
    }
    else{
       run().then(k=>{
        req.body.forEach(async y=>{
       let s=await k.collection('register').updateOne({"mobile":decoded.mobile,"cart.itemname":y.itemname},{$set:{"cart.$.quantity":y.quantity,"cart.$.updatedprice":y.updatedprice}},{returnOriginal:false})
       //.then(u=>{
         //console.log(u)
        //})
       })
       })
    }
  })

})

app.delete('/deletecategory/:nam',(req,res)=>{

   let h=String(req.params.nam)
  
 run().then(lp=>{

   lp.collection('category').deleteOne({categoryname:h}).then(re=>{
    
   })

 })

})


app.post('/getitembycategory',(req,res)=>{
   
  run().then(h=>{

    h.collection('category').findOne({categoryname:req.body.name},{ projection: { items:1, _id: 0 } }).then((result)=>{

      if(result==null){
        res.json({message:"no items there"})
      }
      else{
        
       res.json({message:result})
      }
    })
  })


})

app.post('/ordereditems',(req,res)=>{
      console.log(req.body)
       
        run().then(j=>{
          j.collection('register').updateOne({name:req.body.name},{$push:{orders:{itemname:x.itemname,date:x.date}}}).then(err=>{

            if(err){
              console.log(err)
            }
        
         })
         
       })
    

})

//app.post('/forgotpassword',async (req,res)=>{

 // console.log(req.body.forgotpassword)

  //var options = {authorization : "GgP9jp4Ysa23nvWScNlxbzIMTAufEiOJyLh1ZoHUQ0rwV7dmR6RsAkfjl15qrOHcigPUtdSn4LoIEY2m ", message : 'this is from sarath' ,  numbers : [9666214497]} 

 //await fast2sms.sendMessage(options).then(res=>{console.log(res)}).catch(err=>{console.log(err)})

  //res.json({message:'otp send to mobileno'})



//})

/*app.post('/forgotpassword', async (req, res) => {
  console.log(req.body)
  try {
    const mobileNumber = req.body.forgotpassword;

    const otp = Math.floor(100000 + Math.random() * 900000);
    const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
      params: {
        authorization:"GgP9jp4Ysa23nvWScNlxbzIMTAufEiOJyLh1ZoHUQ0rwV7dmR6RsAkfjl15qrOHcigPUtdSn4LoIEY2m " ,
        variables_values: `Your OTP is ${otp}`,
        route: 'otp',
        numbers: mobileNumber
      }
    });
    res.json({  message: 'OTP sent successfully!' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.json({ success: false, message: 'Failed to send OTP.' });
  }
});*/

app.post('/forgotpassword', async (req, res)=>{
  
  const otp = Math.floor(100000 + Math.random() * 900000);
  clien.messages
  .create({
      body: `Your OTP is ${otp}`,
      from: '+13343268046',
      to: +919666214497
  })
  .then(message=>{

    console.log(message.sid)
  })
  .catch(err=>{console.log(err)})
   
})

app.get('/getallitems',(req,res)=>{
 
  run().then(async h=>{

   let d= await h.collection('category').find({},{ projection: { items:1, _id: 0 } }).toArray()

   let y=[]

   d.forEach(x=>{
    if (Object.keys(x).length != 0) {
     for(k of x.items){
      y.push(k)
    }
    }
   })
    
   res.send(y)
   
 })


})

app.get('/allusers',(req,res)=>{

  run().then(async(y)=>{

   let k= await y.collection('register').find({}).toArray();

   res.json(k)
  })

})

app.post('/addtocart/:token',(req,res)=>{
  //let s= req.params;
  console.log(req.body)
  let token=String(req.params.token)
  
  //let token=String(req.headers.authorization) 
  try{
   jwt.verify(token,secret,(err,decoded)=>{
     if(err){
       console.log(err)
     }
     else{   
       let d=decoded.mobile;
     run().then( k=>{
            
        k.collection('register').findOne({"mobile":d,"cart.itemname":req.body.itemname}).then(y=>{
           if(y!=null){
            
           res.json({message:" already added to cart successfully,once check it to cart"})
    // k.collection('register').findOneAndUpdate({"mobile":d,"cart.itemname":req.body.itemname},{$set:{"cart.$.quantity":1,updatedprice:}},{returnOriginal:false}).then((o,err)=>{

         // })
           }
           else{
            k.collection('register').updateOne({mobile:d},{$push:{cart:{itemname:req.body.itemname,itemimage:req.body.itemimage,quantity:1,price:req.body.price,description:req.body.description,material:req.body.material,colour:req.body.colour}}}).then(y=>{
     
              res.json({message:"added to cart successfully"})
           
           })
           }
          
     
          })
          })
      }
    })
  }
  
 
 catch(err){
   console.log(err)
 }
 
 })

app.get('/getcart/:token',(req,res)=>{
 
   let a=req.params.token;
   jwt.verify(a,secret,(err,decoded)=>{
    if(err){
      console.log(err)
    }
    else{
      run().then(y=>{
          
        
        y.collection('register').findOne({mobile:decoded.mobile}).then(g=>{

          res.json(g)
          
        
          
        })
      })
    }
   })

})

app.post("/updacart",(req,res)=>{
  let dj=req.body
   //console.log(req.params.ik)
  let token=req.headers.authorization;
  jwt.verify(token,secret,async (err,decoded)=>{
   if(err){
     console.log(err)
   }
   else{
     
     run().then(jk=>{
        
      dj.forEach(h=>{

        jk.collection('register').findOneAndUpdate({"mobile":decoded.mobile,"cart.itemname":h.itemname},{$set:{"cart.$.quantity":h.quantity,"cart.$.updatedprice":h.updatedprice}},{returnOriginal:false}).then(y=>{

        //  console.log(y)
      
         })

      })

       })
     
   }
 
 
 })

})


app.post('/descrementofcart',(req,res)=>{
     console.log(req.body)
  console.log(req.body)
  console.log(req.headers)
  let token=req.headers.authorization;
  jwt.verify(token,secret,(err,decoded)=>{
   if(err){
     console.log(err)
   }
   else{
     run().then(t=>{
     req.body.forEach(t=>{
       t.collection('register').findOneAndUpdate({"mobile":decoded.mobile,"cart.itemname":t.itemname},{$set:{"cart.$.quantity":t.quantity,"cart.$.updatedprice":t.updatedprice}},{returnOriginal:false}).then(k=>{
          console.log(k)
      
       })

      })
     })
   }
 
 
 })

})




app.post('/deleteitemcart123',(req,res)=>{
 // let token=req.params
   // console.log(token)
   
   let g=req.headers.authorization
   jwt.verify(g,secret,(err,decoded)=>{
    if(err){
      console.log(err)
    }
    else{
      
     run().then(y=>{
      y.collection('register').updateOne({mobile:decoded.mobile},{$pull:{cart:{itemname:req.body.itemname}}}).then(o=>{
        
      })
     })

    }

  })

})

app.post('/orders',(req,res)=>{
   console.log(req.body.addressobj)
   console.log(req.body.cartarray)

   
   var order = {
  
    items: req.body.cartarray,
 
    order_date: new Date(),
    address:req.body.addressobj,
    status: "Pending"
   };

   let f=req.headers.authorization
   
   jwt.verify(f,secret,(err,decoded)=>{
    if(err){
      console.log(err)
    }
    else{

            run().then(k=>{
        
               //  k.collection('register').updateOne({mobile:decoded.mobile},{$push:{orders:order}}).then
      
                 k.collection('register').updateOne({mobile:decoded.mobile},{$push:{orders:order}}).then(yd=>{
  
                 })
      
                k.collection('register').updateOne({mobile:decoded.mobile},{ $unset: { cart: "" } }).then(y=>{
         
                })

            })

        }
  })
})

app.get('/getallorders',(req,res)=>{
   let a=67
  run().then(async u=>{
   let y=  await u.collection('register').find({},{projection:{name:1,mobile:1,email:1,password:1}}).toArray();
   res.json(y)
   // hello this comment is for test the git

  })
})

app.post('/getallordersbyuser',(req,res)=>{
 console.log(req.body)
 run().then(async y=>{
  let s=await y.collection('register').find({mobile:req.body.mobile},{projection:{orders:1,_id:0}}).toArray();
   res.json(s)
 })
})    



app.post('/loginwithgoogle',(req,res)=>{
  console.log(req.body)
  res.redirect('http://localhost:4200/category/')
})

app.delete('/deleteuser/:mobile',(req,res)=>{
 
  run().then(async y=>{

   let i= await y.collection('register').deleteOne({mobile:req.params.mobile})
   console.log(i)
  })

 
})
 

app.post('/customerorders',(req,res)=>{
      let f=req.headers.authorization
  jwt.verify(f,secret,(err,decoded)=>{
    if(err){

    }
    else{
      run().then(y=>{
        y.collection('register').findOne({mobile:decoded.mobile},{projection:{orders:1,_id:0}}).then(k=>{
          res.json(k)
          console.log(k)
        })
      })
    }

  })
   
 

})

app.get('/yuo',function(req,res){
  //hello iam changing to the hostel to home
})

app.listen(48,(err)=>{

if(err){
    console.log("err")
}

else{
    console.log(`listening on  port ${48}`)
}
})




