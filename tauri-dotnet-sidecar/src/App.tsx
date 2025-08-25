import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import { listen } from '@tauri-apps/api/event';
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [_, setLogs] = useState("[ui] Listening for sidecar & network logs...");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  const apiAction = async (method: string = 'GET', payload?: any) => {
    const url = `http://localhost:5000/weatherforecast`;
    try {
      const body = payload ? JSON.stringify(payload) : null;
      const headers = {
        "Content-Type": "application/json",
      };

      const res = await fetch(url, { method, headers, body });
      if (!res.ok) {
        throw new Error(`Response status: ${res.status}`);
      }
      const json = await res.json();
      console.log(json);
      // Success
      if (json?.message) {
        setLogs(prev => prev += `\n[server-response] ${json.message}`);
      }
      return json;
    } catch (err) {
      console.error(`[server-response] ${err}`);
      setLogs(prev => prev += `\n[server-response] ${err}`);
    }
  }

  const initSidecarListeners = async () => {
    // Listen for stdout lines from the sidecar
    const unlistenStdout = await listen("sidecar-stdout", (event) => {
      console.log("Sidecar stdout:", event.payload);
      if (`${event.payload}`.length > 0 && event.payload !== "\r\n")
        setLogs((prev) => (prev += `\n${event.payload}`));
    });

    // Listen for stderr lines from the sidecar
    const unlistenStderr = await listen("sidecar-stderr", (event) => {
      console.error("Sidecar stderr:", event.payload);
      if (`${event.payload}`.length > 0 && event.payload !== "\r\n")
        setLogs((prev) => (prev += `\n${event.payload}`));
    });

    // Cleanup listeners when not needed
    return () => {
      unlistenStdout();
      unlistenStderr();
    };
  };
  // Start listening for server logs
  useEffect(() => {
    initSidecarListeners();
  }, []);

    const connectServerAction = async () => {
    try {
      const result = await apiAction();
      if (result) {
        setGreetMsg(JSON.stringify(result));
      }
      return;
    } catch (err) {
      console.error(`[ui] Failed to connect to api server. ${err}`);
    }
  }

  return (
    <main className="container">
      <h1>Welcome to Tauri + React</h1>

      <div className="row">
        <a href="https://vite.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit" onClick={connectServerAction}>Greet</button>
      </form>
      <p>{greetMsg}</p>
    </main>
  );
}

export default App;
