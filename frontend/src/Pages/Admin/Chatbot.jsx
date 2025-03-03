import React, { useState, useEffect, useRef } from "react";
import "./Chatbot.css";
import Navbar from "../../components/Navbar/Navbar";
import { useNavigate } from "react-router-dom";

export const Chatbot = () => {
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const handleNavigation = (route) => {
    navigate(route);
  };

  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello! How can I assist you today?" }
  ]);
  const [input, setInput] = useState("");

  // Preloaded case details and leads from the document
  const caseData = {
    summary: `On January 25, 2025, a burglary occurred at a residence. The suspect, later identified as Michael James, broke in through the back door and stole jewelry and electronics worth $5,000. Surveillance footage showed a masked individual fleeing in a black sedan. Investigators linked the suspect through forensic evidence, pawn shop transactions, and threatening messages. Authorities are actively pursuing his arrest.`,
    suspect: "Michael James, a repeat offender with a history of burglary and theft.",
    stolenItems: "Jewelry and electronics valued at approximately $5,000.",
    evidence: [
      "Partial footprints matched a known suspect’s shoe size.",
      "Mud traces linked to a nearby construction site.",
      "Two partial fingerprints matched Michael James' records."
    ],
    leads: {
      "field report": "Officers found forced entry through the back door. No immediate witnesses. Muddy footprints led toward an alley.",
      "911 call": "A neighbor saw a shadowy figure near the back door and heard a loud crash before the call was cut off.",
      "security footage": "A masked individual fled at 11:50 PM and entered a black sedan. The license plate was partially obscured.",
      "victim interview": "The victim reported missing jewelry and electronics. They also received a threatening call before the burglary.",
      "neighborhood canvass": "Witnesses saw a suspicious vehicle and a man in a dark hoodie near the scene.",
      "footprint analysis": "Footprints matched a known suspect, and soil samples linked the suspect to a construction site.",
      "pawn shop": "A stolen laptop was found. The seller, identified as John Doe, had a distinctive tattoo on his left forearm and was a known associate of the suspect.",
      "call logs": "A threatening text message read: 'You're next if you don't listen.' The number was traced to a burner phone.",
      "fingerprints": "Two fingerprints matched Michael James, a repeat offender.",
      "surveillance cameras": "Footage showed the suspect boarding a bus heading north, but witnesses provided conflicting reports on his whereabouts.",
      "abandoned vehicle": "A car matching the suspect's was found abandoned, containing his wallet, gloves, and a crowbar.",
      "person of interest": "Jason Cole initially said the suspect was at an abandoned warehouse but later revised his statement."
    }
  };

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userMessage = input.toLowerCase();
    let botResponse = "I'm not sure how to answer that. Please ask about the case, suspect, evidence, or investigation leads.";

    // Handling different case-related queries
    if (userMessage.includes("summarize") || userMessage.includes("summary")) {
      botResponse = caseData.summary;
    } else if (userMessage.includes("suspect")) {
      botResponse = `The main suspect is ${caseData.suspect}.`;
    } else if (userMessage.includes("stolen") || userMessage.includes("what was taken")) {
      botResponse = `The stolen items include ${caseData.stolenItems}.`;
    } else if (userMessage.includes("evidence")) {
      botResponse = `The main evidence includes: ${caseData.evidence.join(", ")}.`;
    } else {
      // Check for specific leads
      for (const lead in caseData.leads) {
        if (userMessage.includes(lead)) {
          botResponse = caseData.leads[lead];
          break;
        }
      }
    }
    // First, add the user's message to the chat
  setMessages((prevMessages) => [...prevMessages, { sender: "user", text: input }]);
  setInput(""); // Clear input field

  // Add an empty bot message to simulate typing effect
  setMessages((prevMessages) => [...prevMessages, { sender: "bot", text: "" }]);

  // Display bot response word by word
  const words = botResponse.split(" ");
  let currentMessage = "";
  
  words.forEach((word, index) => {
    setTimeout(() => {
      currentMessage += word + " ";
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        updatedMessages[updatedMessages.length - 1] = { sender: "bot", text: currentMessage.trim() };
        return updatedMessages;
      });
    }, index * 200); // 200ms delay per word
  });
};
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="admin-container">
      <Navbar />
      <div className="top-menu">
        <div className="menu-items">
          <span className="menu-item" onClick={() => handleNavigation('/AdminUR')}>User Registration</span>
          <span className="menu-item" onClick={() => handleNavigation('/AdminCM')}>Case Management</span>
          <span className="menu-item" onClick={() => handleNavigation('/AdminSC')}>Search Cases</span>
          <span className="menu-item" onClick={() => handleNavigation('/AdminSP')}>Search People</span>
          <span className="menu-item" onClick={() => handleNavigation('/AdminSP')}>Calendar</span>
          <span className="menu-item" onClick={() => handleNavigation('/AdminDashboard')}>Dashboard</span>
          <span className="menu-item active" onClick={() => handleNavigation('/Chatbot')}>Chatbot</span>
          <span className="menu-item" onClick={() => handleNavigation('/AdminDB')}>Database Backup</span>
        </div>
      </div>

      <div className="chatbot-container">
        <div className="chat-window">
          {messages.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.sender}`}>
              <span>{msg.text}</span>
            </div>
          ))}
          <div ref={chatEndRef}></div>
        </div>

        <div className="chat-input">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything"
          />
          <button onClick={handleSendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
};
