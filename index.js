import express from 'express';
import bodyParser from 'body-parser';
import {dirname} from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { error } from 'console';
import dotenv from 'dotenv/config';


const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;
var to_doList = [];
var date = new Date().getDate();

// setup database

const todoSchema = new mongoose.Schema({
    task: { 
        type: String, 
        required: true 
    }
});

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`Connected to myDB :) || at ${conn.connection.host}`);
    } catch (error) {
        console.log(error);
    }
  }
  
const Todo = await mongoose.model('todoLists', todoSchema);


//const Todo = await mongoose.model('todoLists', todoSchema);
// const todoDefault = new Todo({
//     _id: 0,
//     task: "add your todo"
// });
// await todoDefault.save().then(function (data) {
//     if (data) {
//         console.log(`successfull to add ${todoDefault}`);
//     } else {
//         console.log("Error => "+ err);
//     };
// });



app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/",(req, res)=>{
    const findTodo = () => {
    Todo.find().then( async (data) => {
        console.log("Todolist :" + data);
        res.render(__dirname + "/views/index.ejs", {
            Todolist: data
        });
    }).catch((error) => {
        console.error(error);
        res.status(500).send("Internal Server Error");
    });
    };
    findTodo();
});

app.post("/added",(req, res)=>{
    if (req.body.newTodo != '') {
        const findTodo = async () => {
        Todo.find().then((data) => {
            const newTodo = new Todo({
                task: req.body.newTodo
            });
            console.log("receive: " + newTodo);
            newTodo.save().then(function (data) {
                    if (data) {
                        console.log(`successfull to add ${newTodo}`);
                        Todo.find().then( async (data) => {
                            console.log("Todolist :" + data);
                            res.render(__dirname + "/views/index.ejs", {
                                Todolist: data
                            });
                        }).catch((error) => {
                            console.error(error);
                            res.status(500).send("Internal Server Error");
                        });
                    } else {
                        console.log(err);
                        res.status(500).send("Cannot find DB");
                    };
                });
        })
    };
    findTodo();
    }
});

app.post("/delete",(req, res)=>{
    //console.log(req.body.checkbox);
    const findTodo = () => {
    Todo.findByIdAndRemove({_id:req.body.checkbox}).then((data)=>{
        if (!data) {
            console.log('cannot delete :' + req.body.checkbox);
        } else {
            console.log('succcess to delete : ' + data);
        }
    });
    };
    findTodo();
    res.redirect("/");
});

///////////////////////////////////////////////////////////////////////
// for custom todo list

// creating schema of task list in the array of taskList
const itemSchema = new mongoose.Schema({
    reqParameter : String,
    taskList : [{
        task : String
    }]
});

// adding table to bata base
const Item = mongoose.model('Item', itemSchema);

app.get("/:parameter", async (req, res)=>{
    // get parameter form the body
    const parameter = req.params.parameter;

    // find to check parameter is already exist
    const findTodo = () => {
    Item.findOne({reqParameter: parameter}).then(async (data)=>{
            if (!data) {

                // creating new item of parameter if does not exist 
                const newItem = new Item({
                    reqParameter: parameter,
                    taskList : [{
                        task : `Add Your Todo for ${parameter}`
                    }]
                });
    
                //save new Item of parameter
                await newItem.save().then( async (data)=>{
                    if (!data) {
                        console.log(data);
                    } else {
                        console.log("succes to add: " + data.reqParameter);

                        // find after save new Item then render todo list to EJS
                        var newItemAdded = await Item.findOne({reqParameter: parameter});
                        await res.render(__dirname + "/views/index.ejs",{
                            title: parameter,
                            Todolist : newItemAdded.taskList,
                            parameter : parameter
                        });
                    };
                });
            // if Item of parameter exist
            } else {
                console.log("parameter: " + parameter + " is already exits");
                // render of todolist at parameter Item already exist to EJS
                await res.render(__dirname + "/views/index.ejs",{
                    title: parameter,
                    Todolist : data.taskList,
                    parameter : parameter
                    });
            };
        });;
        };
        findTodo();
});

app.post("/added/:parameter", async (req, res)=>{
    const parameter = req.params.parameter;
    if (req.body.newTodo != '') {

        // get taskList.length to create order id of new todo
        const findTodo = async () => {
        await Item.findOne({reqParameter: parameter}).then( async (data) => {
            const newTodo = new Todo({
                _id : data.taskList.length,
                task: req.body.newTodo
            });
            console.log("receive: " + newTodo);
            // push new todo to Tasklist array
            await Item.updateOne({reqParameter: parameter}, {$push: { taskList: newTodo }}).then((data) => {
                if (data) {
                    console.log(`successfull to add ${newTodo}`);
                    // to show exiting todolist
                    Item.findOne({reqParameter: parameter}).then(async (data)=>{
                        await res.render(__dirname + "/views/index.ejs",{
                            title: parameter,
                            Todolist : data.taskList,
                            parameter : parameter
                        });
                    });
                } else {
                    console.log(err);
                };
            });
        })
    };
    findTodo();
    }
});

app.post("/delete/:parameter", async(req, res)=>{
    // get parameter
    const parameter = req.params.parameter;
    // get id of taskList object
    const id = req.body.checkbox;
    // delete/pull out object that _id matches with id from the takList array
    const updateTodo = async () => {
    await Item.updateOne({ reqParameter:parameter },{ $pull: { taskList: { _id: id } } }).then( (err, result) => {
          if (err) {
            console.error('Error:', err);
          } else {
            console.log('success remove:', result);
          }
        }
      );
    };
    updateTodo();
    // go to /parameter again
    res.redirect("/"+parameter);
});

connectDB().then(()=>{
    app.listen(port, ()=>{
        console.log(`app listen form port ${port}`);
    });
});
