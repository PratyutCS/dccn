// selecting items through their ids
const createButton = document.querySelector("#createroom");
const videoCont = document.querySelector('.video-self');
const codeCont = document.querySelector('#roomcode');
const joinBut = document.querySelector('#joinroom');
const mic = document.querySelector('#mic');
const cam = document.querySelector('#webcam');


let micAllowed = 1;
let camAllowed = 1;

// access to user's media devices
let mediaConstraints = { video: true, audio: true };

//method provided by the WebRTC API that requests access to the user's media devices 
navigator.mediaDevices.getUserMedia(mediaConstraints)
    .then(localstream => {
        videoCont.srcObject = localstream; // allows the user's video to be displayed in the video element.
    })


//generate the random UUID string.
function uuidv4() {
    return 'xxyxyxxyx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const createroomtext = 'Creating Room...';

// adding event listner to button for creating room
createButton.addEventListener('click', (e) => {
    e.preventDefault(); // preventing the form submission or navigation.
    createButton.disabled = true;
    createButton.innerHTML = 'Creating Room';
    createButton.classList = 'createroom-clicked';

    //const name = nameField.value;
    location.href = `/room.html?room=${uuidv4()}`;
});

// adding event listner to button for joining room
joinBut.addEventListener('click', (e) => {
    e.preventDefault(); //prevents the default behavior of the click event

    if (codeCont.value.trim() == "") {// if after removing whitespaces, it is an empty string 
        codeCont.classList.add('roomcode-error'); // then add css element to change color to red 
        return; // return from further executing the function
    }
    const code = codeCont.value; // room code
    location.href = `/room.html?room=${code}`; // navigation : url for joining the room code
})

// adding event listner to room code
/*
codeCont.addEventListener('change', (e) => {
    e.preventDefault();
    if (codeCont.value.trim() !== "") {
        codeCont.classList.remove('roomcode-error');
        return;
    }
})
*/

// adding event listner to camera
cam.addEventListener('click', () => {
    if (camAllowed) {
        mediaConstraints = { video: false, audio: micAllowed ? true : false };
        navigator.mediaDevices.getUserMedia(mediaConstraints) // get user media content
            .then(localstream => {
                videoCont.srcObject = localstream; // make it as videoCont (elem) 's src
            })

        cam.classList = "nodevice"; // css class of cam
        cam.innerHTML = `<i class="fas fa-video-slash"></i>`; // icon of cam
        camAllowed = 0;
    }
    else {
        mediaConstraints = { video: true, audio: micAllowed ? true : false };
        navigator.mediaDevices.getUserMedia(mediaConstraints)
            .then(localstream => {
                videoCont.srcObject = localstream;
            })

        cam.classList = "device";
        cam.innerHTML = `<i class="fas fa-video"></i>`;
        camAllowed = 1;
    }
})

// add event listner to mic
mic.addEventListener('click', () => {
    if (micAllowed) {
        mediaConstraints = { video: camAllowed ? true : false, audio: false };
        navigator.mediaDevices.getUserMedia(mediaConstraints)
            .then(localstream => {
                videoCont.srcObject = localstream;
            })

        mic.classList = "nodevice";
        mic.innerHTML = `<i class="fas fa-microphone-slash"></i>`;
        micAllowed = 0;
    }
    else {
        mediaConstraints = { video: camAllowed ? true : false, audio: true };
        navigator.mediaDevices.getUserMedia(mediaConstraints)
            .then(localstream => {
                videoCont.srcObject = localstream;
            })

        mic.innerHTML = `<i class="fas fa-microphone"></i>`;
        mic.classList = "device";
        micAllowed = 1;
    }
})
