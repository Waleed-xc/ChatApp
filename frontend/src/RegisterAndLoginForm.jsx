import {useContext, useState} from "react";
import axios from "axios";
import {UserContext} from "./UserContext.jsx";
export default function RegisterAndLoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginOrRegister, setIsLoginOrRegister] = useState('login');
  const {setUsername:setLoggedInUsername, setId} = useContext(UserContext);
  async function handleSubmit(ev) {
    ev.preventDefault();
    const url = isLoginOrRegister === 'register' ? 'register' : 'login';
    const {data} = await axios.post(url, {username,password});
    setLoggedInUsername(username);
    setId(data.id);
  }
  return (


    <div className=" bg-zinc-200 h-screen flex items-center  ">
      <form className="w-1/4  mx-auto bg-teal-700 shadow-lg rounded-lg px-8 pt-8 pb-6 " onSubmit={handleSubmit}>
        <input value={username}
               onChange={ev => setUsername(ev.target.value)}
               type="text" placeholder="  Username"
               className="block w-full  rounded-lg p-2 mb-3 border" />
        <input value={password}
               onChange={ev => setPassword(ev.target.value)}
               type="password"
               placeholder="  Password"
               className="block w-full rounded-lg p-2 mb-3 border" />
        <button className="bg-teal-950 text-teal-50 block w-full rounded-lg p-2">
          {isLoginOrRegister === 'register' ? 'Register' : 'Login'}
        </button>
        <div className="text-center text-white mt-2 mb-3">
          {isLoginOrRegister === 'register' && (
            <div>
              Already a member?
              <button className="ml-1" onClick={() => setIsLoginOrRegister('login')}>
                Login here
              </button>
            </div>
          )}
          {isLoginOrRegister === 'login' && (
            <div>
              Dont have an account?
              <button className="ml-1" onClick={() => setIsLoginOrRegister('register')}>
                Register
              </button>
            </div>
          )}
        </div>

      </form>

 
      </div>
  );
}

