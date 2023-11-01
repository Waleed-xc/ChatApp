import {useContext, useEffect, useRef, useState} from "react";
import Avatar from "./Avatar";
import Logo from "./Logo";
import { FaceIcon, FileIcon,SendIcon,PersonIcon,BackIcon } from "./Logo";
import {UserContext} from "./UserContext.jsx";
import {uniqBy} from "lodash";
import axios from "axios";
import Contact from "./Contact";
import EmojiPicker from 'emoji-picker-react';
export default function Chat() {
  const [ws,setWs] = useState(null);
  const [onlinePeople,setOnlinePeople] = useState({});
  const [offlinePeople,setOfflinePeople] = useState({});
  const [selectedUserId,setSelectedUserId] = useState(null);
  const [newMessageText,setNewMessageText] = useState('');
  const [messages,setMessages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const {username,id,setId,setUsername} = useContext(UserContext);
  const divUnderMessages = useRef();
  useEffect(() => {
    connectToWs();
  }, [selectedUserId]);
  function connectToWs() {
    const ws = new WebSocket('ws://localhost:4040');
    setWs(ws);
    ws.addEventListener('message', handleMessage);
    ws.addEventListener('close', () => {
      setTimeout(() => {
        console.log('Disconnected. Trying to reconnect.');
        connectToWs();
      }, 1000);
    });
  }

  const handleEmojiClick = (emoji) => {
    setNewMessageText((prevText) => prevText + emoji.emoji);
  };

  function showOnlinePeople(peopleArray) {
    const people = {};
    peopleArray.forEach(({userId,username}) => {
      people[userId] = username;
    });
    setOnlinePeople(people);
  }
  function handleMessage(ev) {
    const messageData = JSON.parse(ev.data);
    console.log({ev,messageData});
    if ('online' in messageData) {
      showOnlinePeople(messageData.online);
    } else if ('text' in messageData) {
      if (messageData.sender === selectedUserId) {
        setMessages(prev => ([...prev, {...messageData}]));
      }
    }
  }
  function logout() {
    axios.post('/logout').then(() => {
      setWs(null);
      setId(null);
      setUsername(null);
    });
  }
  function sendMessage(ev, file = null) {
    if (ev) ev.preventDefault();
    ws.send(JSON.stringify({
      recipient: selectedUserId,
      text: newMessageText,
      file,
    }));
    if (file) {
      axios.get('/messages/'+selectedUserId).then(res => {
        setMessages(res.data);
      });
    } else {
      setNewMessageText('');
      setMessages(prev => ([...prev,{
        text: newMessageText,
        sender: id,
        recipient: selectedUserId,
        _id: Date.now(),
      }]));
    }
  }
  function sendFile(ev) {
    const reader = new FileReader();
    reader.readAsDataURL(ev.target.files[0]);
    reader.onload = () => {
      sendMessage(null, {
        name: ev.target.files[0].name,
        data: reader.result,
      });
    };
  }

  useEffect(() => {
    const div = divUnderMessages.current;
    if (div) {
      div.scrollIntoView({behavior:'smooth', block:'end'});
    }
  }, [messages]);

  useEffect(() => {
    axios.get('/people').then(res => {
      const offlinePeopleArr = res.data
        .filter(p => p._id !== id)
        .filter(p => !Object.keys(onlinePeople).includes(p._id));
      const offlinePeople = {};
      offlinePeopleArr.forEach(p => {
        offlinePeople[p._id] = p;
      });
      setOfflinePeople(offlinePeople);
    });
  }, [onlinePeople]);

  useEffect(() => {
    if (selectedUserId) {
      axios.get('/messages/'+selectedUserId).then(res => {
        setMessages(res.data);
      });
    }
  }, [selectedUserId]);

  const onlinePeopleExclOurUser = {...onlinePeople};
  delete onlinePeopleExclOurUser[id];

  const messagesWithoutDupes = uniqBy(messages, '_id');

  return (
    <div className="flex h-screen">
      <div className="bg-zinc-50 w-1/4 flex flex-col">
        <div className="flex-grow">
          <Logo />
          {Object.keys(onlinePeopleExclOurUser).map(userId => (
            <Contact
              key={userId}
              id={userId}
              online={true}
              username={onlinePeopleExclOurUser[userId]}
              onClick={() => {setSelectedUserId(userId);console.log({userId})}}
              selected={userId === selectedUserId} />
          ))}
          {Object.keys(offlinePeople).map(userId => (
            <Contact
              key={userId}
              id={userId}
              online={false}
              username={offlinePeople[userId].username}
              onClick={() => setSelectedUserId(userId)}
              selected={userId === selectedUserId} />
          ))}
          
        </div>
        <div className="p-2 text-center flex items-center justify-center">
          <span className="mr-2 bg-teal-700 text-sm text-teal-50 flex items-center py-1 px-2 border rounded-sm ">

          <PersonIcon /> {username}
          </span>
          <button
            onClick={logout}
            className="text-sm bg-teal-700 text-teal-50 border rounded-sm ">  
        
            <span className="mr-5 bg-teal-700 text-sm text-teal-50 flex items-center  py-1 px-2 ">
           <BackIcon/>    Logout
             </span>

             </button>
        </div>
      </div>
      <div className="flex flex-col bg-zinc-50 w-3/4">


{selectedUserId && (
  <div className="navbar bg-teal-700 text-teal-50 font-bold p-4 mx-1">
    <h5>
      {selectedUserId
        ? "Chatting With " + (onlinePeople[selectedUserId] || offlinePeople[selectedUserId].username)
        : ''}
    </h5>
  </div>
)}
        
<div className="flex-grow">
          {!selectedUserId && (
            <div className="flex h-full flex-grow items-center justify-center">
              <div className="text-teal-900">Choose Someone To Chat With</div>
            </div>
          )}
          {!!selectedUserId && (
            <div className="relative h-full">
              <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-2">
                {messagesWithoutDupes.map(message => (
                  <div key={message._id} className={(message.sender === id ? 'text-right': 'text-left')}>
                    <div className={"text-left inline-block p-2 my-1 rounded-md text-md " +(message.sender === id ? 'bg-teal-700 text-white mr-2 ':'bg-gray-300 text-black ml-2')}>
                      {message.text}
                      {message.file && (
                        <div className="">
                          <a target="_blank" className="flex items-center gap-1 border-b" href={axios.defaults.baseURL + '/uploads/' + message.file}>


<FileIcon/>
                            
                            {message.file}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={divUnderMessages}></div>
              </div>
            </div>
          )}
        </div>
        {!!selectedUserId && (
            <form className="flex gap-2 mb-2 ml-1 mr-2" onSubmit={sendMessage}>
            <input
              type="text"
              value={newMessageText}
              onChange={(ev) => setNewMessageText(ev.target.value)}
              placeholder="Type your message here"
              className="bg-white flex-grow border rounded-md p-2"
            />
            <label className="bg-teal-700 p-2 text-teal-50 cursor-pointer rounded-sm border border-teal-700">
              <input type="file" className="hidden" onChange={sendFile} />

<FileIcon/>
              
            </label>
          
            <div
              className="emoji-picker-container"
              style={{
                position: 'absolute',
                bottom: '50px', // Adjust this value based on your design
                right: '20px', // Adjust this value based on your design
                display: showEmojiPicker ? 'block' : 'none',
                zIndex: 1000, // Ensure the emoji picker is above other elements
                background: '#fff',
                border: '1px solid #ccc',
                borderRadius: '5px',
                padding: '10px',
              }}
            >
              {showEmojiPicker && <EmojiPicker onEmojiClick={handleEmojiClick} />}
            </div>
          <label className="bg-teal-700">
            <button
              type="button" // Change the button type to "button" to prevent form submission
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="bg-teal-50 p-2 text-teal-50 cursor-pointer rounded-sm border border-teal-700"
            >  <FaceIcon/>
            </button>
            </label>
            <label className="bg-teal-700">

            <button
              type="submit" // Keep the submit button type as "submit" for form submission
              className="bg-teal-50 p-2 text-teal-50 rounded-sm border border-teal-700"
            >  <SendIcon/>

            </button>
            </label>

          </form>
        )}
      </div>
    </div>
  );
}

