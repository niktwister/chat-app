
let users = []


const addUser = ({id, username, room, joinedAt}) => {

    //  validating the data
    if(!username || !room)
        return {error: 'invalid username or room.'}

    
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    //  check for existing user
    const userexist = users.find( user => user.room === room && user.username === username )

    //  validate username
    if(userexist)
        return {error: 'username is in use.'}

    
    let user = {id, username, room, joinedAt}

    users.push(user)

    return {user}
}



const removeUser = id => {

    const index = users.findIndex( user => user.id === id )

    if(index !== -1)
        return users.splice(index, 1)[0]
    
}


const getUser = id => users.find( user => user.id === id )

const getUsersInRoom = room => users.filter(user => user.room === room)


module.exports = {
    users,
    addUser, 
    removeUser, 
    getUser, 
    getUsersInRoom
}