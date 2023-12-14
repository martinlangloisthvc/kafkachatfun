function boot() {
  cookieStore.get("userId").then((cookie) => {
    window.currentUser = cookie.value;

    Alpine.store("appStore").currentUser = currentUser;

    const socket = io("", {
      auth: {
        userId: currentUser,
      },
    });

    socket.on("connect", () => {
      console.log(socket.id);
    });

    function pushMessage(message) {
      Alpine.store("appStore").messages.push(message);
    }

    socket.on("NEW_MESSAGE", (message) => {
      pushMessage(message);
      console.log(`New message from server:`, message);
    });
  });
}

document.addEventListener("alpine:init", () => {
  Alpine.store("appStore", {
    appReady: true,
    activeConvo: "MAIN",
    currentUser: "",
    messages: [
      {
        content: "ok hey ",
        conversationId: "MAIN",
        from: "dudechill",
      },
    ],
  });

  boot();
});

let userList = () => {
  return {
    userList: [],
    init() {
      console.log("init");
      fetch("/active-users")
        .then((response) => response.json())
        .then((data) => {
          this.userList = data;
        });
    },
  };
};

let activeConvo = () => {
  return {
    get activeConvoMessages() {
      return Alpine.store("appStore").messages.filter(
        (message) => message.convoId == this.activeConvo
      );
    },
  };
};

let messageForm = () => {
  return {
    messageBody: "write your message",
    sendMessage(event = null) {
      // If the event is provided and Shift key is pressed, do nothing
      if (event && event.shiftKey) {
        return;
      }
      let data = {
        conversationId: "MAIN",
        messageBody: this.messageBody,
      };
      console.log(data);
      fetch("message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Adjust the content type based on your server's expectations
          // Add any additional headers as needed
        },
        body: JSON.stringify(data),
      })
        .then((response) => response.json())
        .then((responseData) => {
          // Handle the response data
          console.log("Response:", responseData);
          this.messageBody = "";
        })
        .catch((error) => {
          console.error("Fetch error:", error);
        });
    },
  };
};
