
const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

let userMessage = null;
let isResponseGenerating = false;

// API configuration
const GEMINI_API_KEY = "YOUR GEMINI API KEY";
const API_URL = `YOUR GEMINI API KEY`;

const loadLocalStorageData = () => {
    const savedChats = localStorage.getItem("savedChats");
    const isLightMode = (localStorage.getItem("themeColor") === "light_mode");
    // Apply the stored theme
    document.body.classList.toggle("light_mode", isLightMode);
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

    // Restore the saved chats and scroll to bottom
    chatList.innerHTML = savedChats || "";
    document.body.classList.toggle("hide-header", savedChats);
    scrollToBottom(); // Scroll to the bottom initially
};

loadLocalStorageData();

// Create a new message element and return it
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
};

// Show typing effect by displaying words one by one
const showTypingEffect = (text, textElement) => {
    const words = text.split(' ');
    let currentWordIndex = 0;

    const typingInterval = setInterval(() => {
        // Append each word to the text element with a space
        textElement.innerText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];

        // If all words are displayed
        if (currentWordIndex === words.length) {
            clearInterval(typingInterval);
            isResponseGenerating = false;
            localStorage.setItem("savedChats", chatList.innerHTML); // Save chats to local storage
            scrollToBottom(); // Scroll to the bottom after typing effect
        }
    }, 75); // Adjust the interval time for typing speed
};

const generateAPIResponse = async (incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector(".text");
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [{ text: userMessage }],
                    },
                ],
            }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error.message);
        const apiResponse = data?.candidates[0].content.parts[0].text;
        showTypingEffect(apiResponse, textElement); // Show typing effect
    } catch (error) {
        isResponseGenerating = false;
        textElement.innerText = error.message;
        textElement.classList.add("error");

    } finally {
        incomingMessageDiv.classList.remove("loading");
    }
};

const showLoadingAnimation = () => {
    const html = `
    <div class="message-content">
      <img src="gemini.svg" alt="Gemini Image" class="avatar">
      <p class="text"></p>
      <div class="loading-indicator">
        <div class="loading-bar"></div>
        <div class="loading-bar"></div>
        <div class="loading-bar"></div>
      </div>
    </div>
    <span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>
  `;

    const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
    chatList.appendChild(incomingMessageDiv);

    generateAPIResponse(incomingMessageDiv);
};

const copyMessage = (copyIcon) => {
    const messageText = copyIcon.parentElement.querySelector(".text");
    if (!messageText) return; // Exit if message element not found

    const textContent = messageText.innerText; // Get the actual text content
    navigator.clipboard.writeText(textContent);
    copyIcon.innerText = "done"; // Show tick icon
    setTimeout(() => copyIcon.innerText = "content_copy", 1000); // Revert icon after 1 second
};

// Handle sending outgoing chat messages
const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
    if (!userMessage || isResponseGenerating) return; // Exit if there is no message
    isResponseGenerating = true;

    const html = `
    <div class="message-content">
      <img src="user.jpg" alt="User Image" class="avatar">
      <p class="text">${userMessage}</p> 
    </div>
  `;

    const outgoingMessageDiv = createMessageElement(html, "outgoing");
    chatList.appendChild(outgoingMessageDiv);

    typingForm.reset(); // clear input field
    chatList.scrollTo(0, chatList.scrollHeight);
    document.body.classList.add("hide-header");// hide the error once started
    setTimeout(showLoadingAnimation, 500); // show loading animation after a delay
    //scrollToBottom(); // Scroll to the bottom after sending a message
};
// set userMessages and handleout chat when a suggestion is clicked
suggestions.forEach(suggestion => {
    suggestion.addEventListener("click", () => {
        userMessage = suggestion.querySelector(".text").innerText;
        handleOutgoingChat();
    });
});
// Toggle theme mode and update
toggleThemeButton.addEventListener("click", () => {
    const isLightMode = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});
// Delete all chats from local storage when button is clicked
deleteChatButton.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete all messages?")) {
        localStorage.removeItem("savedChats");
        loadLocalStorageData();
    }
});
// Prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleOutgoingChat();
});

// Helper function to scroll to the bottom of the chat list
function scrollToBottom() {
    chatList.scrollTo({ top: chatList.scrollHeight, behavior: 'smooth' });
}