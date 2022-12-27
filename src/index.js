const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { 
    generateMessage, 
    generateLocationMessage, 
    generateNotification 

} = require('./utils/messages')
const {
    users,
    addUser, 
    removeUser, 
    getUser, 
    getUsersInRoom 

} = require('./utils/users')
 

        
const port = process.env.PORT || 3000
const publicDirPath = path.join(__dirname,'../public')

const app = express()
const httpServer =  http.createServer(app)
const io = new socketio.Server(httpServer)


app.use(express.static(publicDirPath))


app.get('/', (req, res) => {

    res.sendFile(path.join(publicDirPath,'./index.html'))
   
})


io.on('connection', socket => {

    console.log('connection established...')

    socket.on('join', ({username, room}, callback) => {

        let joinedAt = new Date().getTime()
        
        let {error, user} = addUser({id: socket.id, username, room, joinedAt})

        if(error)
            return callback(error, undefined)

        socket.join(user.room)

        socket.emit('notification', generateNotification('Welcome.'))

        socket.to(user.room).emit('notification',generateNotification(`${user.username} has joined the chat.`))
    
        io.to(user.room).emit('room-members-update', getUsersInRoom(user.room))

        callback(undefined, user)
    })


    socket.on('send-message', (msg, callback) => {

        let filter = new Filter()

        if(filter.isProfane(msg))
            return callback('profanity is not allowed.')

        let user = getUser(socket.id)

        if(!user || !msg)
            return callback('message not delivered.')
        
        io.to(user.room).emit('message', generateMessage({text: msg, username: user.username}))

        callback()
        
    })


    socket.on('disconnect', (reason) => {

        let user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('notification',generateNotification(`${user.username} has left the chat.`))
            io.to(user.room).emit('room-members-update', getUsersInRoom(user.room))
        }
    })


    socket.on('send-location', ({latitude, longitude}, callback) => {

        let user = getUser(socket.id)

        if(!user)
            return callback('location not shared.')
        
        io.to(user.room).emit('location-message',generateLocationMessage({latitude, longitude, username: user.username}))
           
        callback()
        
    })
})


httpServer.listen(port, () => console.log(`listening on port ${port}...`))