const { SlashCommandBuilder } = require("discord.js");

const forbiddenWords = [
  "token",
  "t0ken",
  "password",
  "auth",
  "authentication",
  "passkey",
  "code",
  "files",
  "console",
  "log",
  "IP",
  "Address",
  "location",
  "love",
  "l0ve",
  "@everyone",
  "kys",
];

// Define available roles and their intros
const roles = {
  assistant: "You are an assistant, act like one, and speak like one.",
  law_consultant:
    "You are a law consultant, provide professional legal advice.",
  // Add more roles here as needed
};

// Memory to store the last 5 messages (conversation history)
let messageHistory = [];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ai")
    .setDescription("Send a prompt to the AI with a role or profession")
    .addStringOption((option) =>
      option
        .setName("role")
        .setDescription(
          "Select the role of the AI (e.g., assistant, law consultant, etc.)"
        )
        .setRequired(true)
        .addChoices(
          { name: "Assistant", value: "assistant" },
          { name: "Law Consultant", value: "law_consultant" }
          // Add more roles as needed
        )
    )
    .addStringOption((option) =>
      option
        .setName("prompt")
        .setDescription("The prompt to send to the AI")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    let prompt = interaction.options.getString("prompt");
    const role = interaction.options.getString("role");

    if (forbiddenWords.some((word) => prompt.toLowerCase().includes(word))) {
      return interaction.editReply({
        content:
          "Your prompt contains forbidden words and cannot be processed.",
      });
    }

    // Get the intro for the selected role, or default to a generic message if not found
    const roleIntro =
      roles[role] || "You are a professional AI, give a helpful response.";

    // Add the user prompt to the conversation history
    const userMessage = { role: "user", content: prompt };
    messageHistory.push(userMessage);

    // Ensure we keep only the last 5 messages in memory
    if (messageHistory.length > 5) {
      messageHistory.shift(); // Remove the oldest message if there are more than 5
    }

    // Prepare the conversation history for the API request
    const conversationHistory = messageHistory.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    // Add the role intro at the start of the conversation history
    conversationHistory.unshift({
      role: "system",
      content: roleIntro,
    });

    // Only make the API request if the conversation history has any messages
    if (conversationHistory.length > 1) {
      // At least 1 message (system intro)
      const apiUrl = "http://127.0.0.1:11434/api/chat"; // Replace with your actual API URL

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "your-model-name", // Replace with the appropriate model if needed
            messages: conversationHistory,
            stream: false, // Adding stream: false back to the body
          }),
        });

        // Log the raw response to debug
        const rawResponse = await response.text();
        console.log("Raw API Response:", rawResponse);

        // Try to parse the response as JSON
        const data = JSON.parse(rawResponse); // Parse response after logging

        // Ensure the response contains the expected content
        const assistantResponse =
          data?.message?.content || "No response from API.";

        const finalReply = `${assistantResponse}\n\n-# AI can make mistakes. Treat everything it says as fiction. Please note, this AI is from an external source.`;

        // Add assistant's response to memory for future context (ensure the role is "assistant")
        const assistantMessage = {
          role: "assistant",
          content: assistantResponse,
        };
        messageHistory.push(assistantMessage);

        // If the response is empty, return an error message
        if (!finalReply) {
          return interaction.editReply({
            content:
              "There was an issue generating a response. Please try again later.",
          });
        }

        return interaction.editReply({ content: finalReply });
      } catch (error) {
        console.error("Error fetching API:", error);
        return interaction.editReply({
          content: "An error occurred while fetching the response.",
        });
      }
    } else {
      return interaction.editReply({
        content: "No conversation history to send to the API.",
      });
    }
  },
};
