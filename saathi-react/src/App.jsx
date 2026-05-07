import { useState } from "react";

import "./App.css";

import {
  auth,
  googleProvider,
  signInWithPopup,
  signInAnonymously
} from "./firebase";

function App() {

  // ✅ Chat states
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ User state
  const [user, setUser] = useState(null);

  // ✅ Emotional mode
  const [mode, setMode] = useState("vent");

  // ✅ Dark mode
  const [darkMode, setDarkMode] = useState(false);

  // ✅ Google Login
  const loginWithGoogle = async () => {

    try {

      const result = await signInWithPopup(
        auth,
        googleProvider
      );

      setUser(result.user);

    } catch (error) {

      console.error(error);

    }

  };

  // ✅ Anonymous Login
  const loginAnonymous = async () => {

    try {

      const result = await signInAnonymously(auth);

      setUser(result.user);

    } catch (error) {

      console.error(error);

    }

  };

  // ✅ Voice recognition
  const startListening = () => {

    const recognition =
      new window.webkitSpeechRecognition();

    recognition.lang = "en-IN";

    recognition.onresult = (event) => {

      const transcript =
        event.results[0][0].transcript;

      setInput(transcript);

    };

    recognition.start();

  };

  // ✅ AI voice response
  const speak = (text) => {

    const speech =
      new SpeechSynthesisUtterance(text);

    speech.lang = "en-IN";

    window.speechSynthesis.speak(speech);

  };

  // ✅ Send message
  const sendMessage = async () => {

    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      content: input
    };

    setMessages(prev => [
      ...prev,
      userMessage
    ]);

    const currentInput = input;

    setInput("");
    setLoading(true);

    try {

      // ✅ Typing effect
      await new Promise(resolve =>
        setTimeout(resolve, 1000)
      );

      const response = await fetch(
        "http://127.0.0.1:3000/chat",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            message: currentInput,
            mode
          })
        }
      );

      const data = await response.json();

      const aiMessage = {
        role: "assistant",
        content: data.reply
      };

      setMessages(prev => [
        ...prev,
        aiMessage
      ]);

      // ✅ Voice response
      speak(data.reply);

    } catch (error) {

      console.error(error);

      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ Connection error"
        }
      ]);

    }

    setLoading(false);

  };

  // ✅ Login screen
  if (!user) {

    return (

      <div className={
        darkMode
          ? "dark app"
          : "app"
      }>

        <div className="chat-container">

          <h1>Saathi AI</h1>

          <p>
            Your emotional support companion
          </p>

          <button
            onClick={loginWithGoogle}
          >
            Login with Google
          </button>

          <br /><br />

          <button
            onClick={loginAnonymous}
          >
            Continue Anonymously
          </button>

          <br /><br />

          <button
            onClick={() =>
              setDarkMode(!darkMode)
            }
          >
            Toggle Dark Mode
          </button>

        </div>

      </div>

    );

  }

  // ✅ Main chat UI
  return (

    <div className={
      darkMode
        ? "dark app"
        : "app"
    }>

      <div className="chat-container">

        <h1>Saathi AI</h1>

        <p>
          Welcome,
          {" "}
          {
            user.isAnonymous
              ? "Anonymous User"
              : user.displayName
          }
        </p>

        {/* ✅ Controls */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "10px"
          }}
        >

          <select
            value={mode}
            onChange={(e) =>
              setMode(e.target.value)
            }
          >

            <option value="vent">
              Vent Mode
            </option>

            <option value="reflect">
              Reflect Mode
            </option>

            <option value="calm">
              Calm Mode
            </option>

            <option value="clarity">
              Clarity Mode
            </option>

          </select>

          <button
            onClick={() =>
              setDarkMode(!darkMode)
            }
          >
            Dark Mode
          </button>

        </div>

        {/* ✅ Chat */}
        <div className="chat-box">

          {messages.map((msg, index) => (

            <div
              key={index}
              className={
                msg.role === "user"
                  ? "user-msg"
                  : "ai-msg"
              }
            >

              <b>
                {
                  msg.role === "user"
                    ? "You"
                    : "Saathi"
                }
                :
              </b>

              <p>
                {msg.content}
              </p>

            </div>

          ))}

          {loading && (

            <div className="ai-msg">

              <b>Saathi:</b>

              <p>Typing...</p>

            </div>

          )}

        </div>

        {/* ✅ Input area */}
        <div className="input-area">

          <input
            value={input}
            onChange={(e) =>
              setInput(e.target.value)
            }
            placeholder="Share what's on your mind..."
          />

          <button
            onClick={sendMessage}
          >
            Send
          </button>

          <button
            onClick={startListening}
          >
            🎤
          </button>

        </div>

      </div>

    </div>

  );

}

export default App;