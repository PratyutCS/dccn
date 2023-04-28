const socket = io();
const myvideo = document.querySelector("#vd1");
const roomid = params.get("room");
let username;
const chatRoom = document.querySelector('.chat-cont');
const sendButton = document.querySelector('.chat-send');
const messageField = document.querySelector('.chat-input');
const videoContainer = document.querySelector('#vcont');
const overlayContainer = document.querySelector('#overlay')
const continueButt = document.querySelector('.continue-name');
const nameField = document.querySelector('#name-field');
const videoButt = document.querySelector('.novideo');
const audioButt = document.querySelector('.audio');
const cutCall = document.querySelector('.cutcall');
const screenShareButt = document.querySelector('.screenshare');
const whiteboardButt = document.querySelector('.board-icon')


/***********************************             WHITEBOARD START              ******************************************** */

const whiteboardCont = document.querySelector('.whiteboard-cont');
const canvas = document.querySelector("#whiteboard");
const ctx = canvas.getContext('2d');

let boardVisisble = false;

whiteboardCont.style.visibility = 'hidden';

let isDrawing = 0;
let x = 0;
let y = 0;
let color = "black";
let drawsize = 3;
let colorRemote = "black";
let drawsizeRemote = 3;

// fit whiteboard to container
function fitToContainer(canvas) {
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}

fitToContainer(canvas);

/* 
When one user draws something on their canvas, the server sends the drawn image data as a URL to 
other connected clients using socket.io. The other clients then load the image from the URL and
 draw it onto their own canvas.
*/
socket.on('getCanvas', url => { // url -> url of img to be loaded on cavas
    let img = new Image(); // to load image
    img.onload = start; // executed once the img is loaded
    img.src = url; // start the loading 

    function start() {
        ctx.drawImage(img, 0, 0); // 2D canvas rendering context.
    }

    console.log('got canvas', url)
})

// func to set new color
function setColor(newcolor) {
    color = newcolor;
    drawsize = 3;
}

// func to set eraser
function setEraser() {
    color = "white";
    drawsize = 10;
}

/*
//might remove this
function reportWindowSize() {
    fitToContainer(canvas);
}

window.onresize = reportWindowSize;*/
//

// function to clear board
function clearBoard() {
    if (window.confirm('Are you sure you want to clear board? This cannot be undone')) { // asking for confirmation
        ctx.clearRect(0, 0, canvas.width, canvas.height); // add a white rectangle of the same dim. on the canvas
        socket.emit('store canvas', canvas.toDataURL()); // store the cleared canvas on the server side
        socket.emit('clearBoard'); // event emitter -> to clear board of other clients as well
    }
    else return; // if no, then return
}

// event listner -> clear other client's too
socket.on('clearBoard', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
})

// for client who is drawing : local canvas
function draw(newx, newy, oldx, oldy) {
    ctx.strokeStyle = color; // set color
    ctx.lineWidth = drawsize; // set width
    ctx.beginPath(); // begin a new path
    ctx.moveTo(oldx, oldy);// starting point of stroke
    ctx.lineTo(newx, newy); //  ending point of stroke
    ctx.stroke(); // draw a stroke
    ctx.closePath(); // close the path

    socket.emit('store canvas', canvas.toDataURL()); // update in on server side

}

// for other clients : remote canvas
function drawRemote(newx, newy, oldx, oldy) {
    ctx.strokeStyle = colorRemote;
    ctx.lineWidth = drawsizeRemote;
    ctx.beginPath();
    ctx.moveTo(oldx, oldy);
    ctx.lineTo(newx, newy);
    ctx.stroke();
    ctx.closePath();

}

// when the mouse is press down
canvas.addEventListener('mousedown', e => {
    // store current co-ordinates 
    x = e.offsetX;
    y = e.offsetY;

    // user is going to draw
    isDrawing = 1;
})

// when the mouse is moved around
canvas.addEventListener('mousemove', e => {

    if (isDrawing) {
        draw(e.offsetX, e.offsetY, x, y); // draw fun for local canvas
        socket.emit('draw', e.offsetX, e.offsetY, x, y, color, drawsize); // event emitter 
        x = e.offsetX; 
        y = e.offsetY;
    }
})

// when mouse is released 
window.addEventListener('mouseup', e => {

    if (isDrawing) {
        isDrawing = 0; // user no longer drawing 
    }
})

// event listner : to update remote canvas of other clients 
socket.on('draw', (newX, newY, prevX, prevY, color, size) => {
    colorRemote = color;
    drawsizeRemote = size;
    drawRemote(newX, newY, prevX, prevY);
})

/***********************************             WHITEBOARD END              ******************************************** */

let videoAllowed = 1;
let audioAllowed = 1;

let micInfo = {};
let videoInfo = {};

let videoTrackReceived = {};

let mymuteicon = document.querySelector("#mymuteicon");
mymuteicon.style.visibility = 'hidden';

let myvideooff = document.querySelector("#myvideooff");
myvideooff.style.visibility = 'hidden';

const configuration = { iceServers: [{ urls: "stun:stun.stunprotocol.org" }] }

const mediaConstraints = { video: true, audio: true };

let connections = {};
let cName = {};
let audioTrackSent = {};
let videoTrackSent = {};

let mystream, myscreenshare;


document.querySelector('.roomcode').innerHTML = `${roomid}`

// function to copy text
/*
function CopyClassText() {

    var textToCopy = document.querySelector('.roomcode'); // roomcode
    var currentRange; // current selection range
    if (document.getSelection().rangeCount > 0) {
        currentRange = document.getSelection().getRangeAt(0);
        window.getSelection().removeRange(currentRange); // removed 
    }
    else {
        currentRange = false;
    }

    var CopyRange = document.createRange();
    CopyRange.selectNode(textToCopy);
    window.getSelection().addRange(CopyRange);
    document.execCommand("copy");

    window.getSelection().removeRange(CopyRange);

    if (currentRange) {
        window.getSelection().addRange(currentRange);
    }

    document.querySelector(".copycode-button").textContent = "Copied!"
    setTimeout(()=>{
        document.querySelector(".copycode-button").textContent = "Copy Code";
    }, 5000);
}*/

function CopyClassText() {
    var textToCopy = document.querySelector('.roomcode'); // roomcode
    var textToCopyValue = textToCopy.textContent; // get text content
    navigator.clipboard.writeText(textToCopyValue).then(() => { // write text to clipboard
        document.querySelector(".copycode-button").textContent = "Copied!";
        setTimeout(()=>{
            document.querySelector(".copycode-button").textContent = "Copy Code";
        }, 5000);
    }).catch((err) => {
        console.error('Unable to copy text', err);
    });
}


/**********************************         Enter name section              ****************** */

// add event listner to when user enters name 
continueButt.addEventListener('click', () => {
    if (nameField.value == '') return; // no name then return 
    username = nameField.value; // take usernmae 
    overlayContainer.style.visibility = 'hidden'; // set the ask box's visibility to hidden
    document.querySelector("#myname").innerHTML = `${username} (You)`;  
    socket.emit("join room", roomid, username);

})


nameField.addEventListener("keyup", function (event) {
    if (event.keyCode === 13) { // if user has clicked the enter button ( key code of key )
        event.preventDefault();
        continueButt.click();
    }
});

/**********************************         Enter name section              ****************** */

// apply style according to user - count 
socket.on('user count', count => {
    if (count > 1) {
        videoContainer.className = 'video-cont';
    }
    else {
        videoContainer.className = 'video-cont-single';
    }
})

let peerConnection;

// function to hande get user media error
function handleGetUserMediaError(e) {
    switch (e.name) {
        case "NotFoundError":
            alert("Unable to open your call because no camera and/or microphone" +
                "were found.");
            break;
        case "SecurityError":
        case "PermissionDeniedError":
            break;
        default:
            alert("Error opening your camera and/or microphone: " + e.message);
            break;
    }

}

// function to print error in console.
function reportError(e) {
    console.log(e);
    return;
}

/******************************         MAIN FUNCTIONS            *****************************  */

// function to startCall
function startCall() {

    navigator.mediaDevices.getUserMedia(mediaConstraints) // req access to media devices. returns a promise
    // if fulfilled
        .then(localStream => {
            myvideo.srcObject = localStream; // displays video stream
            myvideo.muted = true; // local video doesn't produce sound, avoiding echo

            // localstream -> obj containing one or more tracks 
            localStream.getTracks().forEach(track => { // for each track 
                for (let key in connections) { // iterates over the connection 
                    connections[key].addTrack(track, localStream); // add the track to the connection along with local media stream
                    // depending on the kind 
                    //keeps track of which audio or video track is associated with each connection separately.
                    if (track.kind === 'audio')
                        audioTrackSent[key] = track;
                    else
                        videoTrackSent[key] = track;
                }
            })

        })
        // if rejected
        .catch(handleGetUserMediaError);


}


 //?
function handleVideoOffer(offer, sid, cname, micinf, vidinf) {

     // Store the received video offer details in respective variables
     cName[sid] = cname; // Store the cname (display name) in an array with sid as key
     micInfo[sid] = micinf; // Store the micinf (microphone info) in an array with sid as key
     videoInfo[sid] = vidinf; // Store the vidinf (video info) in an array with sid as key
     connections[sid] = new RTCPeerConnection(configuration); // Create a new RTCPeerConnection object with sid as key in the connections array
 
     // Set an event listener for icecandidate event on the RTCPeerConnection
     connections[sid].onicecandidate = function (event) {
         if (event.candidate) {
             console.log('icecandidate fired');
             // Emit the new icecandidate to the server along with sid as identifier
             socket.emit('new icecandidate', event.candidate, sid);
         }
     };
 
     // Set an event listener for track event on the RTCPeerConnection
     connections[sid].ontrack = function (event) {
 
         // If the video element with the given sid does not exist, create and append it to the videoContainer
         if (!document.getElementById(sid)) {
             console.log('track event fired')
             let vidCont = document.createElement('div');
             let newvideo = document.createElement('video');
             let name = document.createElement('div');
             let muteIcon = document.createElement('div');
             let videoOff = document.createElement('div');
             // Add classes and set innerHTML for the created elements
             videoOff.classList.add('video-off');
             muteIcon.classList.add('mute-icon');
             name.classList.add('nametag');
             name.innerHTML = `${cName[sid]}`;
             vidCont.id = sid;
             muteIcon.id = `mute${sid}`;
             videoOff.id = `vidoff${sid}`;
             muteIcon.innerHTML = `<i class="fas fa-microphone-slash"></i>`;
             videoOff.innerHTML = 'Video Off'
             vidCont.classList.add('video-box');
             newvideo.classList.add('video-frame');
             newvideo.autoplay = true;
             newvideo.playsinline = true;
             newvideo.id = `video${sid}`;
             newvideo.srcObject = event.streams[0];
 
             // Set visibility of muteIcon and videoOff based on micInfo and videoInfo values
             if (micInfo[sid] == 'on')
                 muteIcon.style.visibility = 'hidden';
             else
                 muteIcon.style.visibility = 'visible';
 
             if (videoInfo[sid] == 'on')
                 videoOff.style.visibility = 'hidden';
             else
                 videoOff.style.visibility = 'visible';
 
             // Append the created elements to vidCont div and append vidCont to videoContainer div
             vidCont.appendChild(newvideo);
             vidCont.appendChild(name);
             vidCont.appendChild(muteIcon);
             vidCont.appendChild(videoOff);
             videoContainer.appendChild(vidCont);
 
         }
     };
 
     // Set an event listener for removetrack event on the RTCPeerConnection
     connections[sid].onremovetrack = function (event) {
         if (document.getElementById(sid)) {
             // If the video element with the given sid exists, remove it from the DOM
             document.getElementById(sid).remove();
             console.log('removed a track');
         }
     };
 

     connections[sid].onnegotiationneeded = function () {
        // This function is triggered when a negotiation is needed with the peer
    
        connections[sid].createOffer() // Create an offer to initiate the negotiation process
            .then(function (offer) {
                return connections[sid].setLocalDescription(offer); // Set the local description with the offer
            })
            .then(function () {
                // Emit the video-offer event with the local description and session ID
                socket.emit('video-offer', connections[sid].localDescription, sid);
            })
            .catch(reportError); // Catch any errors and report them
    };
    
    let desc = new RTCSessionDescription(offer); // Create a new session description object with the offer received
    
    connections[sid].setRemoteDescription(desc) // Set the remote description with the offer received
        .then(() => {
            // Request access to media devices (e.g. camera and microphone)
            return navigator.mediaDevices.getUserMedia(mediaConstraints);
        })
        .then((localStream) => {
            // After receiving access to media devices, add the local stream to the peer connection
    
            localStream.getTracks().forEach(track => {
                connections[sid].addTrack(track, localStream); // Add each track from the local stream to the peer connection
                console.log('added local stream to peer');
    
                // Store the audio and video tracks in separate arrays based on their kind (audio or video)
                if (track.kind === 'audio') {
                    audioTrackSent[sid] = track; // Store the audio track in the audioTrackSent array with the session ID as the key
                    if (!audioAllowed)
                        audioTrackSent[sid].enabled = false; // Disable the audio track if audio is not allowed
                } else {
                    videoTrackSent[sid] = track; // Store the video track in the videoTrackSent array with the session ID as the key
                    if (!videoAllowed)
                        videoTrackSent[sid].enabled = false; // Disable the video track if video is not allowed
                }
            })
        })
        .then(() => {
            // Create an answer to the offer received
            return connections[sid].createAnswer();
        })
        .then(answer => {
            // Set the local description with the answer
            return connections[sid].setLocalDescription(answer);
        })
        .then(() => {
            // Emit the video-answer event with the local description and session ID
            socket.emit('video-answer', connections[sid].localDescription, sid);
        })
        .catch(handleGetUserMediaError); // Catch any errors related to getting user media and handle them
    

}

// fucntion to handle new Ice Candidate
function handleNewIceCandidate(candidate, sid) {
    console.log('new candidate recieved')
    var newcandidate = new RTCIceCandidate(candidate);

    connections[sid].addIceCandidate(newcandidate)
        .catch(reportError);
}

// function to handle Video Answer
// establishing a WebRTC video call, where the offer and answer exchange session 
function handleVideoAnswer(answer, sid) {
    console.log('answered the offer')
    const ans = new RTCSessionDescription(answer);
    connections[sid].setRemoteDescription(ans);
}

socket.on('video-offer', handleVideoOffer);
socket.on('new icecandidate', handleNewIceCandidate);
socket.on('video-answer', handleVideoAnswer);


socket.on('join room', async (conc, cnames, micinfo, videoinfo) => {
    socket.emit('getCanvas'); // emits event

    // checks for truthness.. if yes, then stores the val
    if (cnames)
        cName = cnames;

    if (micinfo)
        micInfo = micinfo;

    if (videoinfo)
        videoInfo = videoinfo;


    console.log(cName);

    if (conc) {
        await conc.forEach(sid => { // for each conntection
            connections[sid] = new RTCPeerConnection(configuration); //rtc object is created and stored into connections with [sid] as index

            // sid -> connection id of user 

            // event handler 
            connections[sid].onicecandidate = function (event) {
                if (event.candidate) {
                    // local ICE candidate is sent to the server
                    console.log('icecandidate fired');
                    socket.emit('new icecandidate', event.candidate, sid);
                }
            };

            connections[sid].ontrack = function (event) {

                if (!document.getElementById(sid)) { // if sid already exists in DOM
                    console.log('track event fired')

                    // creates elements
                    let vidCont = document.createElement('div');
                    let newvideo = document.createElement('video');
                    let name = document.createElement('div');
                    let muteIcon = document.createElement('div');
                    let videoOff = document.createElement('div');

                    //Setting properties and attributes of HTML elements:
                    videoOff.classList.add('video-off');
                    muteIcon.classList.add('mute-icon');
                    name.classList.add('nametag');
                    name.innerHTML = `${cName[sid]}`;
                    vidCont.id = sid;
                    muteIcon.id = `mute${sid}`;
                    videoOff.id = `vidoff${sid}`;
                    muteIcon.innerHTML = `<i class="fas fa-microphone-slash"></i>`;
                    videoOff.innerHTML = 'Video Off'
                    vidCont.classList.add('video-box');
                    newvideo.classList.add('video-frame');
                    newvideo.autoplay = true;
                    newvideo.playsinline = true;
                    newvideo.id = `video${sid}`;
                    newvideo.srcObject = event.streams[0];

                    if (micInfo[sid] == 'on')
                        muteIcon.style.visibility = 'hidden';
                    else
                        muteIcon.style.visibility = 'visible';

                    if (videoInfo[sid] == 'on')
                        videoOff.style.visibility = 'hidden';
                    else
                        videoOff.style.visibility = 'visible';

                    //Appending HTML elements to the video container
                    vidCont.appendChild(newvideo);
                    vidCont.appendChild(name);
                    vidCont.appendChild(muteIcon);
                    vidCont.appendChild(videoOff);

                    videoContainer.appendChild(vidCont);

                }

            };

            // when media rack is removed from rtc connection
            connections[sid].onremovetrack = function (event) {
                if (document.getElementById(sid)) {
                    document.getElementById(sid).remove();
                }
            }

            //negotiation is needed for establishing a new WebRTC session
            //used for initiating the WebRTC signaling process for establishing a new peer-to-peer connection or renegotiating an existing connection.

            connections[sid].onnegotiationneeded = function () {

                // creates an offer 
                connections[sid].createOffer()
                    .then(function (offer) {
                        // sets offer as local description
                        return connections[sid].setLocalDescription(offer);
                    })
                    .then(function () {
                        // emits an event
                        socket.emit('video-offer', connections[sid].localDescription, sid);

                    })
                    .catch(reportError); // if promise fails 
            };

        });

        console.log('added all sockets to connections');
        startCall();

    }
    else {
        console.log('waiting for someone to join');
        navigator.mediaDevices.getUserMedia(mediaConstraints) // asks for permission
            .then(localStream => {
                myvideo.srcObject = localStream; // displays the local video stream of the current user
                myvideo.muted = true; // mutes audio of video to prevent echo
                mystream = localStream; // stored for further use
            })
            .catch(handleGetUserMediaError);
    }
})

/******************************         MAIN FUNCTIONS            *****************************  */

/*****************          Screen Sharing          ************************ */

// add event listner on clicked screenShareButt
screenShareButt.addEventListener('click', () => {
    screenShareToggle();
});

let screenshareEnabled = false;



function screenShareToggle() {
    let screenMediaPromise; //promise related to obtaining a media stream for screen sharing

    if (!screenshareEnabled) {
        // 3 types of getting the media stream for screen sharing
        if (navigator.getDisplayMedia) {
            screenMediaPromise = navigator.getDisplayMedia({ video: true });
        } else if (navigator.mediaDevices.getDisplayMedia) {
            screenMediaPromise = navigator.mediaDevices.getDisplayMedia({ video: true });
        } else {
            screenMediaPromise = navigator.mediaDevices.getUserMedia({
                video: { mediaSource: "screen" },
            });
        }
    } else {
        screenMediaPromise = navigator.mediaDevices.getUserMedia({ video: true });
    }


    screenMediaPromise
        .then((myscreenshare) => {
            screenshareEnabled = !screenshareEnabled; // updates it
            for (let key in connections) { // iterating through all the connections established

                //replaces the video track of each sender with the video track from the obtained screen sharing media stream
                const sender = connections[key]
                    .getSenders()
                    .find((s) => (s.track ? s.track.kind === "video" : false));
                sender.replaceTrack(myscreenshare.getVideoTracks()[0]);
            }
           
            //sets the new media stream as the source object for myvideo element, and sets it as the muted stream for mystream.
            const newStream = new MediaStream([
                myscreenshare.getVideoTracks()[0], 
            ]);
             myscreenshare.getVideoTracks()[0].enabled = true;
            myvideo.srcObject = newStream;
            myvideo.muted = true;
            mystream = newStream;

            // updates the ui of hmtl
            screenShareButt.innerHTML = (screenshareEnabled 
                ? `<i class="fas fa-desktop"></i><span class="tooltiptext">Stop Share Screen</span>`
                : `<i class="fas fa-desktop"></i><span class="tooltiptext">Share Screen</span>`
            );

            //the function is called when screen sharing is called off
            myscreenshare.getVideoTracks()[0].onended = function() {
                if (screenshareEnabled) screenShareToggle();
            };
        })
        .catch((e) => { // catching error
            alert("Unable to share screen:" + e.message);
            console.error(e);
        });
}

/*****************          Screen Sharing          ************************ */
// event listner to remove peer
socket.on('remove peer', sid => {
    if (document.getElementById(sid)) {
        document.getElementById(sid).remove();
    }

    delete connections[sid];
})

// sets up an event , callback function
sendButton.addEventListener('click', () => {
    const msg = messageField.value; // take the input from where the user has typed
    messageField.value = ''; // after storing, clear it
    socket.emit('message', msg, username, roomid); // emits an event for sending message
})

// adds event listner to messageField
messageField.addEventListener("keyup", function (event) {
    if (event.keyCode === 13) { // if enter key is presses 
        event.preventDefault();
        sendButton.click(); // send message
    }
});

// event listner to set for sending message
socket.on('message', (msg, sendername, time) => {
    chatRoom.scrollTop = chatRoom.scrollHeight; // updates the scroll botton, to show all recent messages
    chatRoom.innerHTML += `<div class="message">
    <div class="info">
        <div class="username">${sendername}</div>
        <div class="time">${time}</div>
    </div>
    <div class="content">
        ${msg}
    </div>
</div>`
});


// add event listner for video button
videoButt.addEventListener('click', () => {

    if (videoAllowed) { // checks if video is allowed or not 
        for (let key in videoTrackSent) {
            videoTrackSent[key].enabled = false; // disables video fot all video tracks that were prev sent to other users
        }
        // changing css 
        videoButt.innerHTML = `<i class="fas fa-video-slash"></i>`; 
        videoAllowed = 0;
        videoButt.style.backgroundColor = "#b12c2c";

        if (mystream) {
            mystream.getTracks().forEach(track => {
                if (track.kind === 'video') {
                    track.enabled = false; // disables video for local stream
                }
            })
        }

        myvideooff.style.visibility = 'visible';

        socket.emit('action', 'videooff');
    }
    else {
        for (let key in videoTrackSent) {
            videoTrackSent[key].enabled = true;
        }
        videoButt.innerHTML = `<i class="fas fa-video"></i>`;
        videoAllowed = 1;
        videoButt.style.backgroundColor = "#4ECCA3";

        if (mystream) {
            mystream.getTracks().forEach(track => {
                if (track.kind === 'video')
                    track.enabled = true;
            })
        }


        myvideooff.style.visibility = 'hidden';

        socket.emit('action', 'videoon');
    }
})

// add event listner for audio button
audioButt.addEventListener('click', () => {

    if (audioAllowed) {
        for (let key in audioTrackSent) {
            audioTrackSent[key].enabled = false;
        }
        audioButt.innerHTML = `<i class="fas fa-microphone-slash"></i>`;
        audioAllowed = 0;
        audioButt.style.backgroundColor = "#b12c2c";
        if (mystream) {
            mystream.getTracks().forEach(track => {
                if (track.kind === 'audio')
                    track.enabled = false;
            })
        }

        mymuteicon.style.visibility = 'visible';

        socket.emit('action', 'mute');
    }
    else {
        for (let key in audioTrackSent) {
            audioTrackSent[key].enabled = true;
        }
        audioButt.innerHTML = `<i class="fas fa-microphone"></i>`;
        audioAllowed = 1;
        audioButt.style.backgroundColor = "#4ECCA3";
        if (mystream) {
            mystream.getTracks().forEach(track => {
                if (track.kind === 'audio')
                    track.enabled = true;
            })
        }

        mymuteicon.style.visibility = 'hidden';

        socket.emit('action', 'unmute');
    }
})

// event listner to action
socket.on('action', (msg, sid) => {
    if (msg == 'mute') {
        console.log(sid + ' muted themself');
        document.querySelector(`#mute${sid}`).style.visibility = 'visible';
        micInfo[sid] = 'off';
    }
    else if (msg == 'unmute') {
        console.log(sid + ' unmuted themself');
        document.querySelector(`#mute${sid}`).style.visibility = 'hidden';
        micInfo[sid] = 'on';
    }
    else if (msg == 'videooff') {
        console.log(sid + 'turned video off');
        document.querySelector(`#vidoff${sid}`).style.visibility = 'visible';
        videoInfo[sid] = 'off';
    }
    else if (msg == 'videoon') {
        console.log(sid + 'turned video on');
        document.querySelector(`#vidoff${sid}`).style.visibility = 'hidden';
        videoInfo[sid] = 'on';
    }
})

// setting whiteboard visible or invisble
whiteboardButt.addEventListener('click', () => {
    if (boardVisisble) {
        whiteboardCont.style.visibility = 'hidden';
        boardVisisble = false;
    }
    else {
        whiteboardCont.style.visibility = 'visible';
        boardVisisble = true;
    }
})

// add event listner when cut button is clicked
cutCall.addEventListener('click', () => {
    location.href = '/';
})