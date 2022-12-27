
const $form = document.querySelector('#message-form')
const $share_loc = $form.children['share-loc']
const $chat_box = document.querySelector('#chat-box')
const $room_title = document.querySelector('#room-title')
const $room_members = document.querySelector('#room-members')
const $theme_toggler = document.querySelector('#theme-toggler')
const $root = document.querySelector(':root')


const msgTemplate = document.querySelector('#message-template').innerHTML
const locMsgTemplate = document.querySelector('#location-message-template').innerHTML
const notifTemplate = document.querySelector('#notification-template').innerHTML
const roomMembersTemplate = document.querySelector('#room-members-template').innerHTML

const MAX_RECONN_ATTEMPTS = 5


/************************* auto scrolling logic ************************************/
/***********************************************************************************/


//
//                |`````   |```````````````````````````|     `````|   
//                |        | * * * * * * * * * * * * * |          |
//                |        |  * * * * * * * * * * * *  |       $chat_box.scrollTop
//                |        | * * * * * * * * * * * * * |          | 
//                |        |  * * * * * * * * * * * *  |          |
//                |        ||`````````````````````````||     `````|
//                |        ||                         ||          |
//                |        ||                         ||          |
//                |        ||         VISIBLE         ||          |
// $chat_box.scrollHeight  ||          AREA           ||       $chat_box.offsetHeight
//                |        ||                         ||          |
//                |        ||                         ||          |
//                |        ||                         ||          |
//                |        ||                         ||          |
//                |        |```````````````````````````|      ````|            `````|
//                |        | * * * * * * * * * * * * * |          |                 |
//                |        |  * * * * * * * * * * * *  |   prev scrollBottom        |
//                |        | * * * * * * * * * * * * * |          |           new scrollBottom
//                |        |  * * * * * * * * * * * *  |          |                 |
//                |        |```````````````````````````|      ````|                 |
//                |        | * * * new message * * * * |   new message height       |
//                `````    `````````````````````````````      `````            ``````  
//
//
//
//  scrollHeight :  whole content's height (not just the visible part) + padding (does not 
//                  include border, margin, or horizontal scrollbar(if present)) 
//
//  offsetHeight :  visible height of the element  (including borders)

const autoscroll = () => {

    //  this function is called after adding the new msg.
    //
    //  In our case each new msg will add this much extra height to the scrollHeight of 
    //  our chat_box :
    //    new_message_height  =    gap (flex prop)   +    new_message.offsetHeight 
    //
    let new_message = $chat_box.lastElementChild

    let gap = parseInt( getComputedStyle($chat_box).gap )

    let new_message_height = gap + new_message.offsetHeight

    //
    //  value of scrollBottom before the new msg was added :
    //
    //    prev_scrollBottom = max( new_scrollBottom - new_message_height , 0 )
    //    where ,
    //    new_scrollBottom = (chat_box.scrollHeight - chat_box.scrollTop - chat_box.offsetHeight)
    //
    //  Note that scrollBottom cannot be negative.                      
    //
    //  Now if we were scrolled down to the bottom before the new message arrived , then 
    //  prev_scrollBottom would be 0, otherwise not.
    //
    //  And if we were at the bottom then $chat_box.scrollTop should be increased by 
    //  new_message_height in order to auto scroll to the bottom again.
    //
    //  And if we were not at the bottom, then ignore.

    let new_scrollBottom = $chat_box.scrollHeight - $chat_box.scrollTop - $chat_box.offsetHeight

    let prev_scrollBottom = Math.max( new_scrollBottom - new_message_height , 0 )

    if(prev_scrollBottom === 0)
        $chat_box.scrollTop += new_message_height
        
}



/***************************** theme toggling logic ********************************/
/***********************************************************************************/

if(localStorage.getItem('chat-app-theme') === 'dark'){
    $theme_toggler.checked = true
    $root.classList.add('dark-theme')
}


$theme_toggler.addEventListener('change', e => {

    if(e.target.checked){
        $root.classList.add('dark-theme')
        localStorage.setItem('chat-app-theme','dark')
    }else{
        $root.classList.remove('dark-theme')
        localStorage.removeItem('chat-app-theme')
    }

})

/******************** viewing / hiding the room members list ***********************/
/***********************************************************************************/

const view_members = () => $room_members.style.visibility = 'visible'

const hide_members = () => $room_members.style.visibility = ''



/**************************** socket.io logic **************************************/
/***********************************************************************************/


let socket = io()

let reconn_attempts = 0

let {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})


socket.on('connect', () => {

    //  reseting reconnection attempts
    reconn_attempts = 0

    //  debugging
    console.log('connected...') 

    //  emitting 'join' event upon connection & reconnection since server-side socket will
    //  automatically leave the room upon disconnection.
    socket.emit('join', {username, room}, (error, user) => {

        if(error){
            alert(error)
            return location.href = '/'
        }            
        //  debugging    
        console.log('joined successfully...')

        //  updating username & room values as server preprocesses them (i.e., trimming the 
        //  spaces around & converting letters to lowercase ) before storing.
        username    =   user.username
        room        =   user.room

        $room_title.textContent = room
    })   
})


socket.on('room-members-update', users => {

    //  debugging
    console.log(users)

    users.forEach( user => user.joinedAt = moment(user.joinedAt).format('h:mm a') )

    let html = Mustache.render(roomMembersTemplate, {users})

    $room_members.innerHTML = html
})


socket.on('notification', notification => {

    //  debugging
    console.log(notification)

    let html = Mustache.render(notifTemplate, {
        text: notification.text,
        createdAt: moment(notification.createdAt).format('h:mm a')
    })

    $chat_box.insertAdjacentHTML('beforeend', html)

    autoscroll()
})


socket.on('message', message => {

    //  debugging
    console.log(message)

    let html = Mustache.render(msgTemplate, {
        owner: message.username === username ? 'self' : 'other',
        username: message.username,
        text: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $chat_box.insertAdjacentHTML('beforeend', html)

    autoscroll()
})

socket.on('location-message', message => {

    //  debugging
    console.log(message)

    let html = Mustache.render(locMsgTemplate, {
        owner: message.username === username ? 'self' : 'other',
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:m a')
    })
    $chat_box.insertAdjacentHTML('beforeend', html)

    autoscroll()
})



$form.addEventListener('submit', e => {

    e.preventDefault()

    const $message = e.target.children.message
    const $send_msg = e.target.children["send-msg"]


    $message.disabled = true
    $send_msg.disabled = true

    
    socket.emit('send-message', $message.value, (error) => {

        $message.disabled = false
        $send_msg.disabled = false

        $message.focus()
        
        if(error)
            return alert(error)
        
        //  debugging
        console.log('message delivered !!')
    })

    $message.value = ''
    

})


$share_loc.addEventListener('click', e => {

    if(!navigator.geolocation)
        return alert('geolocation is not supported in your browser.')

      
    // Clicking the image input will also fire the submit event of form. But browser will
    // cancel it since we are disabling the input.
    // https://stackoverflow.com/questions/51537983/form-doesnt-get-submitted-when-theres-click-event-on-submit-button
    // https://stackoverflow.com/questions/37217778/disabling-submit-button-cancels-submit-event 
    $share_loc.disabled = true


    navigator.geolocation.getCurrentPosition( position => {

        let {latitude, longitude} = position.coords
        
        socket.emit('send-location', {latitude, longitude}, (error) => {

            $share_loc.disabled = false
            
            if(error)
                return alert(error)

            //  debugging
            console.log('location shared !!')
        })
    },
    error => {

        $share_loc.disabled = false
        
        //  debugging
        alert(error)
    } )

})



socket.on('connect_error', () => {

    ++reconn_attempts;
    
    //  debugging
    console.log(`error connecting ${reconn_attempts}...`) 


    if(reconn_attempts === MAX_RECONN_ATTEMPTS){
        socket.disconnect()

        //  debugging
        alert(`manually disconnected after failing to connect ${reconn_attempts} times. Please close the window.`)
    }
})

/***********************************************************************************/
/***********************************************************************************/
