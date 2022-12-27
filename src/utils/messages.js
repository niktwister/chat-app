
const generateNotification = text => {

    return {
        text,
        createdAt: new Date().getTime()
    }
}


const generateMessage = ({text, username}) => {

    return {
        text,
        username,
        createdAt: new Date().getTime()
    }
}


const generateLocationMessage = ({latitude, longitude, username}) => {

    return {
        username,
        url: `https://www.google.com/maps?q=${latitude},${longitude}`,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateMessage,
    generateNotification,
    generateLocationMessage
}