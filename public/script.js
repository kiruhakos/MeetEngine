const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const userList = document.getElementById('userList');
let body = document.getElementsByTagName('body')
const messageInput = document.querySelector('#input_chat_message')
const send = document.getElementById('send')
const messageContainer = document.querySelector('.message_container')
const sendForm = document.getElementById('sendForm')
let myVideo = null;
const myPeer = new Peer(undefined, {
  host: 'https://meetengine.onrender.com',
  port: '3001'
})

let myVideoStream;

document.getElementById("userForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const nameInput = document.getElementById("username");
  const name = nameInput.value.trim();
  if (name) {
    if (myVideo) {
      myVideo.remove();
    }
    socket.emit("join-room", ROOM_ID, myPeer.id, name);
    navigator.mediaDevices.getUserMedia({
      video: {
        width: 300,
        height: 300
      },
      audio: {
        noiseSuppression: true,
        echoCancellation: true
      }
    })
    .then(stream => {
      myVideoStream = stream
      myVideo = document.createElement('video')
      myVideo.muted = true
      addVideoStream(myVideo, stream)
      myPeer.on('call', call => {
        if(call){
        call.answer(stream)
        let video = document.createElement('video')
        call.on('stream', userVideoStream => {
          addVideoStream(video, userVideoStream)
        })
      }})
      socket.on('user-connected', (userId) => {
        connectToNewUser(userId, stream)
      })
    })
    .catch(error => {
      console.error(error)
    })
    nameInput.value = ""
    

  send.addEventListener('click', e => {
      e.preventDefault()
      if (messageInput.value.length > 0){
         socket.emit('send-message', messageInput.value)
         messageInput.value = ''
      }
  })
  messageInput.addEventListener('keydown', e =>{
    if (e.key === 'Enter' && messageInput.value.length > 0){
        e.preventDefault()
        socket.emit('send-message', messageInput.value)
        messageInput.value = ''
  }
  })
  socket.on("new-message", (message, name) => {
    const messageElement = document.createElement("div");
    const messageText = document.createElement("span");
    const nameText = document.createElement("span");
  
    messageText.textContent = message;
    nameText.textContent = name + ' says: ';
  
    messageElement.appendChild(nameText);
    messageElement.appendChild(messageText);
    messageElement.classList.add("message");
    document.getElementById("messageContainer").appendChild(messageElement);
  });
  }
});

socket.on('updateUserList', (users) => {
  let html = '';
  users.forEach(user => {
    html += `<li><i class="fa-solid fa-circle-user"></i>  ${user.name}</li>`;
  });
  userList.innerHTML = html;
});

socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close()
})

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    video.remove()
  })

  peers[userId] = call
}

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}

function leaveRoom(){
  const video = document.querySelector('video')
  const mediaStream = video.srcObject
  const tracks = mediaStream.getTracks()
  tracks[0].stop()
  tracks.forEach(track => track.stop())
    setStopVideo()
    setMuteButton()
}

const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    setMuteButton();
  }
}
const playStopVideo = () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo()
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    setStopVideo()
  }
}
const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
  `
  document.querySelector('.video_button').innerHTML = html;
}

const setPlayVideo = () => {
  const html = `
  <i class="stop fas fa-video-slash"></i>
  `
  document.querySelector('.video_button').innerHTML = html;
}
const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
  `
  document.querySelector('.mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
  const html = `
  <i class="fa-solid fa-microphone-slash"></i>
  `
  document.querySelector('.mute_button').innerHTML = html;
}

const screenShareGrid = document.getElementById('screenShareGrid');

const video = document.getElementById('video');

let screenShareButton = document.querySelector('#screenShareBtn');
screenShareButton.addEventListener('click', (e) => {
  e.preventDefault()
  navigator.mediaDevices.getDisplayMedia({
    video: {
      width: 500, 
      height: 500,
      cursor: "always"
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true
    }
  }).then(screenStream => {
    const videoTracks = screenStream.getVideoTracks();
    const myVideoStream = myVideo.srcObject;
    const myVideoTrack = myVideoStream.getVideoTracks()[0];
    myVideoTrack.stop();
    myVideoStream.removeTrack(myVideoTrack);
    myVideoStream.addTrack(videoTracks[0]);
    myVideo.srcObject = myVideoStream;
    for (let userId in peers) {
      const peer = peers[userId];
      if (peer.peerConnection) {
        const sender = peer.peerConnection.getSenders().find(sender => sender.track.kind === 'video');
        sender.replaceTrack(videoTracks[0]);
      }
}
  }).catch(err =>{
    console.log('Cannot share the screen:', err)
  })
});







