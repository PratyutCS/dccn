// static/app.js
const socket = io()
const chat = document.querySelector('.chat-form')
const chatInput = document.querySelector('.chat-input')
chat.addEventListener('submit', e => {
  e.preventDefault()
  if((chatInput.value).trim() === ''){
    return;
  }
  socket.emit('chat', chatInput.value)
  chatInput.value = ''
})
const client_dump = document.querySelector('.client_dump')
const user_dump = document.querySelector('.user_dump')
const render = ({message, id}) => {
  const div = document.createElement('div')
  const div2 = document.createElement('div')
  const txt = document.createElement('h5')
  div2.classList.add('free')
  txt.innerHTML = message
  if (id === socket.id) {
    div.classList.add('chat-client_div')
    txt.classList.add('chat-message--user')
    div.appendChild(txt)
    user_dump.appendChild(div)
    console.log(div.offsetHeight);
    div2.style.height=div.offsetHeight+"px";
    client_dump.appendChild(div2)
  }
  else{
    div.classList.add('chat-user_div')
    txt.classList.add('chat-message--client')
    div.appendChild(txt)
    client_dump.appendChild(div)
    console.log(div.offsetHeight);
    div2.style.height=div.offsetHeight+"px";
    user_dump.appendChild(div2)
  }
}
socket.on('chat', data => {
  render(data)
})